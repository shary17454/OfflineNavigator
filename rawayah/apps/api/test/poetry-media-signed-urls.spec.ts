import { Test } from '@nestjs/testing';
import { PoetryService } from '../src/modules/poetry/poetry.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { StorageService } from '../src/shared/media/storage.service';

// اختبارات تثبّت أن mediaUrl المُعاد للمستهلك (تطبيق الجوال/الموقع) رابط
// موقَّع فعلي قابل للعرض، لا مفتاح تخزين خام لا يمكن فتحه مباشرة. هذه
// الفجوة كانت موثَّقة صراحةً في IMPLEMENTATION_PLAN.md قبل هذا الإصلاح.
describe('PoetryService — روابط الوسائط الموقَّعة', () => {
  let service: PoetryService;
  let prisma: any;
  let storage: any;

  beforeEach(async () => {
    prisma = {
      poet: { findUnique: jest.fn() },
      poetFile: { findUnique: jest.fn() },
      poetFileItem: { findMany: jest.fn() },
      poem: { findMany: jest.fn().mockResolvedValue([]) },
      story: { findMany: jest.fn().mockResolvedValue([]) },
      contentSource: { findMany: jest.fn().mockResolvedValue([]) },
      nameVariant: { findMany: jest.fn().mockResolvedValue([]) },
      entityRelation: { findMany: jest.fn().mockResolvedValue([]) },
      narration: { findMany: jest.fn().mockResolvedValue([]) },
    };
    storage = { getSignedDownloadUrl: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        PoetryService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();
    service = moduleRef.get(PoetryService);
  });

  const publishedPoet = (overrides: Record<string, unknown> = {}) => ({
    id: 'poet-1',
    fullName: 'شاعر منشور',
    status: 'PUBLISHED',
    ...overrides,
  });

  describe('getPublicPoetLibrary', () => {
    it('يستبدل مفتاح التخزين برابط موقَّع فعلي للمادة الصوتية', async () => {
      prisma.poet.findUnique.mockResolvedValue(publishedPoet());
      prisma.poetFile.findUnique.mockResolvedValue({ id: 'file-1', overview: null });
      prisma.poetFileItem.findMany.mockResolvedValue([
        { id: 'item-1', kind: 'AUDIO', title: 'تسجيل', mediaUrl: 'poet-files/abc.mp3' },
      ]);
      storage.getSignedDownloadUrl.mockResolvedValue('https://minio.example/signed/abc.mp3?sig=xyz');

      const result = await service.getPublicPoetLibrary('poet-1');

      expect(result.audios[0].mediaUrl).toBe('https://minio.example/signed/abc.mp3?sig=xyz');
      // منشورة فعلًا (حقوقها مكشوفة) — تُستخدم مدة الصلاحية العامة الأطول لا الخاصة.
      expect(storage.getSignedDownloadUrl).toHaveBeenCalledWith('poet-files/abc.mp3', false);
    });

    it('لا يستدعي التوقيع لمادة نصية (لا مفتاح تخزين لها أصلًا)', async () => {
      prisma.poet.findUnique.mockResolvedValue(publishedPoet());
      prisma.poetFile.findUnique.mockResolvedValue({ id: 'file-1', overview: null });
      prisma.poetFileItem.findMany.mockResolvedValue([
        { id: 'item-1', kind: 'TEXT', title: 'قصيدة', bodyText: 'نص القصيدة', mediaUrl: null },
      ]);

      await service.getPublicPoetLibrary('poet-1');

      expect(storage.getSignedDownloadUrl).not.toHaveBeenCalled();
    });

    it('لا يستدعي التوقيع لرابط خارجي (externalUrl ليس مفتاح تخزين)', async () => {
      prisma.poet.findUnique.mockResolvedValue(publishedPoet());
      prisma.poetFile.findUnique.mockResolvedValue({ id: 'file-1', overview: null });
      prisma.poetFileItem.findMany.mockResolvedValue([
        { id: 'item-1', kind: 'EXTERNAL_LINK', title: 'رابط', externalUrl: 'https://example.com', mediaUrl: null },
      ]);

      await service.getPublicPoetLibrary('poet-1');

      expect(storage.getSignedDownloadUrl).not.toHaveBeenCalled();
    });

    it('يعرض المادة بلا رابط بدل كسر الصفحة كاملة عند تعذّر التوقيع', async () => {
      prisma.poet.findUnique.mockResolvedValue(publishedPoet());
      prisma.poetFile.findUnique.mockResolvedValue({ id: 'file-1', overview: null });
      prisma.poetFileItem.findMany.mockResolvedValue([
        { id: 'item-1', kind: 'IMAGE', title: 'صورة', mediaUrl: 'poet-files/missing.jpg' },
      ]);
      storage.getSignedDownloadUrl.mockRejectedValue(new Error('NoSuchKey'));

      const result = await service.getPublicPoetLibrary('poet-1');

      expect(result.images[0].mediaUrl).toBeNull();
    });

    it('يوقّع كل مادة وسائط مستقلة عند تعدد المواد', async () => {
      prisma.poet.findUnique.mockResolvedValue(publishedPoet());
      prisma.poetFile.findUnique.mockResolvedValue({ id: 'file-1', overview: null });
      prisma.poetFileItem.findMany.mockResolvedValue([
        { id: 'item-1', kind: 'AUDIO', title: 'صوت 1', mediaUrl: 'poet-files/a.mp3' },
        { id: 'item-2', kind: 'VIDEO', title: 'فيديو 1', mediaUrl: 'poet-files/b.mp4' },
      ]);
      storage.getSignedDownloadUrl.mockImplementation((key: string) => Promise.resolve(`https://signed/${key}`));

      const result = await service.getPublicPoetLibrary('poet-1');

      expect(result.audios[0].mediaUrl).toBe('https://signed/poet-files/a.mp3');
      expect(result.videos[0].mediaUrl).toBe('https://signed/poet-files/b.mp4');
      expect(storage.getSignedDownloadUrl).toHaveBeenCalledTimes(2);
    });
  });

  describe('getOwnerPoetLibrary — مواد قيد المراجعة تُعامل كخاصة', () => {
    it('يوقّع الرابط بمدة الصلاحية الخاصة القصيرة لا العامة', async () => {
      prisma.poetFile.findUnique.mockResolvedValue({
        id: 'file-1',
        items: [{ id: 'item-1', kind: 'DOCUMENT', mediaUrl: 'poet-files/draft.pdf' }],
      });
      storage.getSignedDownloadUrl.mockResolvedValue('https://minio.example/signed-private/draft.pdf');

      const result = await service.getOwnerPoetLibrary('poet-1');

      expect(result.items[0].mediaUrl).toBe('https://minio.example/signed-private/draft.pdf');
      expect(storage.getSignedDownloadUrl).toHaveBeenCalledWith('poet-files/draft.pdf', true);
    });
  });

  describe('listPendingReview — الرابط الموقَّع لا يتعارض مع التنبيهات الآلية', () => {
    it('يعيد mediaUrl موقَّعًا مع الاحتفاظ بحقل checks', async () => {
      prisma.poetFileItem.findMany
        .mockResolvedValueOnce([
          {
            id: 'item-1',
            poetFileId: 'file-1',
            kind: 'AUDIO',
            title: 'تسجيل قيد المراجعة',
            mediaUrl: 'poet-files/review.mp3',
            rightsStatus: 'UNKNOWN',
            sourceId: 'src-1',
            reciterName: 'راوٍ',
          },
        ])
        .mockResolvedValueOnce([]); // فحص التكرار لا يجد شيئًا مشابهًا

      storage.getSignedDownloadUrl.mockResolvedValue('https://minio.example/signed-review/review.mp3');

      const [item] = await service.listPendingReview();

      expect(item.mediaUrl).toBe('https://minio.example/signed-review/review.mp3');
      expect(storage.getSignedDownloadUrl).toHaveBeenCalledWith('poet-files/review.mp3', true);
      expect(Array.isArray(item.checks)).toBe(true);
    });
  });
});
