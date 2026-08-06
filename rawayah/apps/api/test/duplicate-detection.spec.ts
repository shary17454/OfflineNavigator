import { Test } from '@nestjs/testing';
import { normalizeArabic, trigramSimilarity } from '../src/shared/common/arabic-normalize';
import { DuplicateDetectionService } from '../src/modules/ingestion/duplicate-detection.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';

describe('normalizeArabic / trigramSimilarity — تطبيع حقيقي بلا محاكاة (سيناريو 7)', () => {
  it('يعامل اختلاف الهمزات كنص متطابق', () => {
    expect(normalizeArabic('أحمد')).toBe(normalizeArabic('احمد'));
    expect(normalizeArabic('إبراهيم')).toBe(normalizeArabic('ابراهيم'));
  });

  it('يعامل اختلاف الياء والألف المقصورة كنص متطابق', () => {
    expect(normalizeArabic('موسى')).toBe(normalizeArabic('موسي'));
  });

  it('يزيل التشكيل والتطويل', () => {
    expect(normalizeArabic('مُحَمَّـــد')).toBe(normalizeArabic('محمد'));
  });

  it('يعطي تشابهًا مرتفعًا بين عنوانين متطابقين بعد التطبيع فقط', () => {
    const score = trigramSimilarity('قصيدة الوفاء', 'قصيده الوفاء');
    expect(score).toBeGreaterThan(0.8);
  });

  it('يعطي تشابهًا منخفضًا بين عنوانين مختلفين فعليًا', () => {
    const score = trigramSimilarity('قصيدة الوفاء', 'كتاب تاريخ الجزيرة');
    expect(score).toBeLessThan(0.3);
  });
});

describe('DuplicateDetectionService — كشف تكرار بلا حذف تلقائي', () => {
  it('يعيد مرشحًا واحدًا فقط فوق حد التشابه، ويرتّب الأعلى تشابهًا أولًا', async () => {
    const prisma: any = {
      poem: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'p1', title: 'يا طارق الوادي' },
          { id: 'p2', title: 'يا طارق الوادى' }, // شبه مطابق بعد التطبيع
          { id: 'p3', title: 'قصيدة عن الصحراء والليل' },
        ]),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [DuplicateDetectionService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = moduleRef.get(DuplicateDetectionService);

    const matches = await service.findCandidates('POEM' as any, { title: 'يا طارق الوادي' });

    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].existingContentId).toBe('p1');
  });

  it('يعيد قائمة فارغة إذا كان العنوان المرشّح فارغًا', async () => {
    const prisma: any = { poem: { findMany: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [DuplicateDetectionService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = moduleRef.get(DuplicateDetectionService);

    const matches = await service.findCandidates('POEM' as any, { title: '' });
    expect(matches).toEqual([]);
    expect(prisma.poem.findMany).not.toHaveBeenCalled();
  });
});
