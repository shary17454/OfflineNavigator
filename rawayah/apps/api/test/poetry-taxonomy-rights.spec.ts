import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PoetryService } from '../src/modules/poetry/poetry.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { StorageService } from '../src/shared/media/storage.service';

// اختبارات تثبّت الحواجز التي تحمي المالك قانونيًا ومحتوائيًا:
// بوابة الحقوق قبل نشر الوسائط، ومنع المساهم من تجاوز المراجعة،
// وسلامة شجرة التصنيفات عند التعديل والدمج.
describe('PoetryService — بوابة الحقوق وسلامة التصنيفات', () => {
  let service: PoetryService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      poetFileItem: { findUnique: jest.fn(), update: jest.fn() },
      poetryTaxonomyTerm: { findUnique: jest.fn(), update: jest.fn() },
      poemTaxonomy: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
      poem: { findUnique: jest.fn() },
      rightsRecord: { upsert: jest.fn() },
      $transaction: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        PoetryService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: { save: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(PoetryService);
  });

  const approvedAudio = (overrides: Record<string, unknown> = {}) => ({
    id: 'item-1',
    kind: 'AUDIO',
    reviewState: 'APPROVED',
    rightsStatus: 'PUBLIC_DOMAIN',
    allowDisplay: true,
    contributedById: 'narrator-1',
    ...overrides,
  });

  describe('publishPoetFileItem — بوابة الحقوق', () => {
    it('يرفض نشر مادة لم تُعتمد في المراجعة', async () => {
      prisma.poetFileItem.findUnique.mockResolvedValue(approvedAudio({ reviewState: 'SUBMITTED' }));
      await expect(service.publishPoetFileItem('item-1', 'owner')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.poetFileItem.update).not.toHaveBeenCalled();
    });

    it.each(['UNKNOWN', 'UNDER_REVIEW', 'RESTRICTED', 'EXPIRED', 'TAKEDOWN_REQUESTED'])(
      'يرفض نشر وسائط حالة حقوقها %s',
      async (rightsStatus) => {
        prisma.poetFileItem.findUnique.mockResolvedValue(approvedAudio({ rightsStatus }));
        await expect(service.publishPoetFileItem('item-1', 'owner')).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.poetFileItem.update).not.toHaveBeenCalled();
      },
    );

    it('يرفض النشر إذا كانت الحقوق مسموحة لكن العرض غير مسموح', async () => {
      prisma.poetFileItem.findUnique.mockResolvedValue(approvedAudio({ allowDisplay: false }));
      await expect(service.publishPoetFileItem('item-1', 'owner')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.poetFileItem.update).not.toHaveBeenCalled();
    });

    it.each(['PUBLIC_DOMAIN', 'LICENSED', 'PERMISSION_GRANTED'])(
      'يسمح بالنشر عندما تكون الحقوق %s والعرض مسموح',
      async (rightsStatus) => {
        prisma.poetFileItem.findUnique.mockResolvedValue(approvedAudio({ rightsStatus }));
        prisma.poetFileItem.update.mockResolvedValue({ id: 'item-1', status: 'PUBLISHED' });
        await service.publishPoetFileItem('item-1', 'owner');
        expect(prisma.poetFileItem.update).toHaveBeenCalled();
      },
    );

    // المادة النصية لا تمر ببوابة الحقوق لأنها ليست ملفًا مرفوعًا،
    // لكنها تبقى خاضعة لشرط الاعتماد في المراجعة.
    it('ينشر المادة النصية المعتمدة دون اشتراط حالة حقوق ملف', async () => {
      prisma.poetFileItem.findUnique.mockResolvedValue(
        approvedAudio({ kind: 'TEXT', rightsStatus: 'UNKNOWN', allowDisplay: false }),
      );
      prisma.poetFileItem.update.mockResolvedValue({ id: 'item-1', status: 'PUBLISHED' });
      await service.publishPoetFileItem('item-1', 'owner');
      expect(prisma.poetFileItem.update).toHaveBeenCalled();
    });
  });

  describe('submitPoetFileItem — حدود المساهم', () => {
    it('يمنع المساهم من تعديل مادة أضافها غيره', async () => {
      prisma.poetFileItem.findUnique.mockResolvedValue(
        approvedAudio({ reviewState: 'DRAFT', contributedById: 'someone-else' }),
      );
      await expect(service.submitPoetFileItem('item-1', 'narrator-1', false)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('يسمح للمساهم بإرسال مادته هو', async () => {
      prisma.poetFileItem.findUnique.mockResolvedValue(approvedAudio({ reviewState: 'DRAFT' }));
      prisma.poetFileItem.update.mockResolvedValue({ id: 'item-1', reviewState: 'SUBMITTED' });
      await service.submitPoetFileItem('item-1', 'narrator-1', false);
      expect(prisma.poetFileItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ reviewState: 'SUBMITTED' }) }),
      );
    });

    it('يمنع إعادة إرسال مادة منشورة بالفعل', async () => {
      prisma.poetFileItem.findUnique.mockResolvedValue(approvedAudio({ reviewState: 'PUBLISHED' }));
      await expect(service.submitPoetFileItem('item-1', 'narrator-1', false)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('updateTaxonomyTerm — سلامة الشجرة', () => {
    it('يمنع جعل التصنيف أبًا لنفسه', async () => {
      prisma.poetryTaxonomyTerm.findUnique.mockResolvedValue({ id: 'a', dimension: 'THEME' });
      await expect(service.updateTaxonomyTerm('a', { parentId: 'a' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('يمنع الحلقة: جعل تصنيف فرعي أبًا لتصنيفه الأصل', async () => {
      // a هو أصل b. محاولة جعل b أبًا لـ a يجب أن تُرفض.
      prisma.poetryTaxonomyTerm.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'a') return Promise.resolve({ id: 'a', parentId: null, dimension: 'THEME' });
        if (where.id === 'b') return Promise.resolve({ id: 'b', parentId: 'a', dimension: 'THEME' });
        return Promise.resolve(null);
      });
      await expect(service.updateTaxonomyTerm('a', { parentId: 'b' })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('mergeTaxonomyTerm — الدمج لا يحذف', () => {
    it('يرفض دمج التصنيف مع نفسه', async () => {
      await expect(service.mergeTaxonomyTerm('a', { targetTermId: 'a' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('يرفض الدمج بين بُعدين مختلفين', async () => {
      prisma.poetryTaxonomyTerm.findUnique
        .mockResolvedValueOnce({ id: 'a', dimension: 'THEME' })
        .mockResolvedValueOnce({ id: 'b', dimension: 'ERA' });
      await expect(service.mergeTaxonomyTerm('a', { targetTermId: 'b' })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('setPoemTaxonomy', () => {
    it('يرفض الربط بتصنيف مدموج ويوجّه إلى التصنيف الهدف', async () => {
      prisma.poem.findUnique.mockResolvedValue({ id: 'poem-1' });
      prisma.poetryTaxonomyTerm.findMany = jest
        .fn()
        .mockResolvedValue([{ id: 't1', nameAr: 'قديم', mergedIntoId: 't2' }]);
      await expect(service.setPoemTaxonomy('poem-1', { termIds: ['t1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
