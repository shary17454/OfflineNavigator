import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PoetryService } from '../src/modules/poetry/poetry.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { StorageService } from '../src/shared/media/storage.service';

// اختبارات الفحوصات الآلية المساعِدة ورفع ملفات مواد المكتبة.
describe('PoetryService — الفحوصات المساعِدة ورفع الملفات', () => {
  let service: PoetryService;
  let prisma: any;
  let storage: any;

  beforeEach(async () => {
    prisma = {
      poetFileItem: { findMany: jest.fn() },
      poetFile: { findUnique: jest.fn() },
      mediaFile: { create: jest.fn() },
    };
    storage = { save: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        PoetryService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();
    service = moduleRef.get(PoetryService);
  });

  const pending = (overrides: Record<string, unknown> = {}) => ({
    id: 'item-1',
    poetFileId: 'file-1',
    kind: 'TEXT',
    title: 'قصيدة في الفروسية',
    bodyText: null,
    rightsStatus: 'UNKNOWN',
    sourceId: 'src-1',
    sourceNotes: null,
    materialDate: '1350',
    reciterName: null,
    ...overrides,
  });

  describe('listPendingReview — التنبيهات لا تحجب النشر', () => {
    it('يرصد عنوانًا شديد الشبه بمادة أخرى في نفس المكتبة', async () => {
      prisma.poetFileItem.findMany
        .mockResolvedValueOnce([pending()])
        .mockResolvedValueOnce([{ id: 'other', title: 'قصيدة في الفروسية', bodyText: null, status: 'PUBLISHED' }]);

      const [item] = await service.listPendingReview();
      const types = item.checks.map((c: any) => c.type);
      expect(types).toContain('DUPLICATE_TITLE');
    });

    it('لا يرصد تكرارًا لعنوانين مختلفين فعلًا', async () => {
      prisma.poetFileItem.findMany
        .mockResolvedValueOnce([pending()])
        .mockResolvedValueOnce([{ id: 'other', title: 'رواية عن مجلس القبيلة', bodyText: null, status: 'PUBLISHED' }]);

      const [item] = await service.listPendingReview();
      const types = item.checks.map((c: any) => c.type);
      expect(types).not.toContain('DUPLICATE_TITLE');
    });

    it('ينبّه على غياب المصدر تمامًا', async () => {
      prisma.poetFileItem.findMany
        .mockResolvedValueOnce([pending({ sourceId: null, sourceNotes: null })])
        .mockResolvedValueOnce([]);

      const [item] = await service.listPendingReview();
      expect(item.checks.map((c: any) => c.type)).toContain('MISSING_SOURCE');
    });

    it('ينبّه على حقوق غير مضبوطة للوسائط', async () => {
      prisma.poetFileItem.findMany
        .mockResolvedValueOnce([pending({ kind: 'AUDIO', rightsStatus: 'UNKNOWN', reciterName: 'راوٍ' })])
        .mockResolvedValueOnce([]);

      const [item] = await service.listPendingReview();
      expect(item.checks.map((c: any) => c.type)).toContain('RIGHTS_NOT_SET');
    });

    it('لا ينبّه على الحقوق عندما تكون مضبوطة بحالة تسمح بالنشر', async () => {
      prisma.poetFileItem.findMany
        .mockResolvedValueOnce([pending({ kind: 'AUDIO', rightsStatus: 'PUBLIC_DOMAIN', reciterName: 'راوٍ' })])
        .mockResolvedValueOnce([]);

      const [item] = await service.listPendingReview();
      expect(item.checks.map((c: any) => c.type)).not.toContain('RIGHTS_NOT_SET');
    });
  });

  describe('uploadPoetFileMedia', () => {
    it('يرفض رفع ملف لنوع نصي', async () => {
      await expect(
        service.uploadPoetFileMedia('poet-1', 'TEXT', { buffer: Buffer.from(''), originalname: 'a.txt', mimetype: 'text/plain' }, 'u1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('يرفض الرفع إذا لم تكن للشاعر مكتبة', async () => {
      prisma.poetFile.findUnique.mockResolvedValue(null);
      await expect(
        service.uploadPoetFileMedia('poet-1', 'AUDIO', { buffer: Buffer.from(''), originalname: 'a.mp3', mimetype: 'audio/mpeg' }, 'u1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.save).not.toHaveBeenCalled();
    });

    // الملف يُخزَّن خاصًا لأن المادة لم تُراجع ولم تُحدَّد حقوقها بعد.
    it('يخزّن الملف كخاص دائمًا عند الرفع', async () => {
      prisma.poetFile.findUnique.mockResolvedValue({ id: 'file-1' });
      storage.save.mockResolvedValue({
        storageKey: 'poet-files/x.mp3',
        mimeType: 'audio/mpeg',
        size: 100,
        originalName: 'a.mp3',
      });

      await service.uploadPoetFileMedia(
        'poet-1',
        'AUDIO',
        { buffer: Buffer.from(''), originalname: 'a.mp3', mimetype: 'audio/mpeg' },
        'u1',
      );

      expect(prisma.mediaFile.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isPrivate: true }) }),
      );
      expect(storage.save).toHaveBeenCalledWith(expect.anything(), 'audio', 'poet-files');
    });
  });
});
