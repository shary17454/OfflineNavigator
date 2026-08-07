import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SourceConflictsService } from '../src/modules/sources/source-conflicts.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';

/// اختبارات تعارض المصادر.
///
/// ما تحرسه هذه الاختبارات ليس "هل الكود يعمل" بل قاعدة المشروع الأصلية:
/// الخلاف بين المصادر يُحفظ ويُعرض ولا يُحسم تلقائيًا. أي تعديل مستقبلي
/// يجعل النظام يرجّح مصدرًا من تلقاء نفسه سيكسر هذه الاختبارات، وهو
/// المقصود.
describe('SourceConflictsService — مقارنة المصادر وحفظ الخلاف', () => {
  let service: SourceConflictsService;
  let prisma: any;

  const baseDto = {
    contentType: 'POEM' as any,
    contentId: 'poem-1',
    subject: 'نسبة البيت الثالث',
    conflictType: 'ATTRIBUTION' as any,
    sourceAId: 'src-a',
    sourceAClaim: 'ينسبه إلى امرئ القيس',
    sourceBId: 'src-b',
    sourceBClaim: 'ينسبه إلى طرفة بن العبد',
  };

  beforeEach(async () => {
    prisma = {
      source: { findUnique: jest.fn() },
      sourceConflict: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      trustAssessment: { findUnique: jest.fn(), update: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [SourceConflictsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(SourceConflictsService);
  });

  it('يرفض تسجيل تعارض بين المصدر ونفسه', async () => {
    await expect(service.create({ ...baseDto, sourceBId: 'src-a' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.sourceConflict.create).not.toHaveBeenCalled();
  });

  it('يرفض التعارض إذا كان أحد المصدرين غير موجود', async () => {
    prisma.source.findUnique.mockResolvedValueOnce({ id: 'src-a' }).mockResolvedValueOnce(null);
    await expect(service.create(baseDto)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.sourceConflict.create).not.toHaveBeenCalled();
  });

  it('يحفظ الخلاف بطرفيه ونصّ ادعاء كل مصدر، ويبدأ بحالة PENDING لا محسومة', async () => {
    prisma.source.findUnique.mockResolvedValue({ id: 'x' });
    prisma.trustAssessment.findUnique.mockResolvedValue(null);
    prisma.sourceConflict.create.mockResolvedValue({ id: 'c1' });

    await service.create(baseDto);

    const data = prisma.sourceConflict.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      sourceAId: 'src-a',
      sourceAClaim: 'ينسبه إلى امرئ القيس',
      sourceBId: 'src-b',
      sourceBClaim: 'ينسبه إلى طرفة بن العبد',
      conflictType: 'ATTRIBUTION',
    });
    // لا حسم تلقائي: الحقول لا تُمرَّر أصلًا فتأخذ القيمة الافتراضية PENDING.
    expect(data.resolution).toBeUndefined();
    expect(data.confidence).toBeUndefined();
  });

  it('يعكس التعارض على بطاقة الثقة فلا تبقى تقول "متفق عليه" وفي القاعدة خلاف', async () => {
    prisma.source.findUnique.mockResolvedValue({ id: 'x' });
    prisma.trustAssessment.findUnique.mockResolvedValue({ id: 't1' });
    prisma.sourceConflict.create.mockResolvedValue({ id: 'c1' });

    await service.create(baseDto);

    expect(prisma.trustAssessment.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { hasConflictingSources: true, consensusStatus: 'DISPUTED' },
    });
  });

  it('يرفض النشر بوصفه "مختلفًا فيه" بلا نص ملاحظة يُعرض للقارئ', async () => {
    prisma.sourceConflict.findUnique.mockResolvedValue({ id: 'c1' });
    await expect(
      service.resolve('c1', { resolution: 'BOTH_PUBLISHED_AS_DISPUTED' as any, confidence: 'LOW' as any }, 'owner-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.sourceConflict.update).not.toHaveBeenCalled();
  });

  it('يرفض ترجيح أحد المصدرين بلا تعليل مكتوب من المراجع', async () => {
    prisma.sourceConflict.findUnique.mockResolvedValue({ id: 'c1' });
    await expect(
      service.resolve('c1', { resolution: 'SOURCE_A_PREFERRED' as any, confidence: 'HIGH' as any }, 'owner-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.sourceConflict.update).not.toHaveBeenCalled();
  });

  it('يقبل الترجيح المعلَّل ويسجّل المراجع ووقت الحسم', async () => {
    prisma.sourceConflict.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.sourceConflict.update.mockResolvedValue({ id: 'c1' });

    await service.resolve(
      'c1',
      { resolution: 'SOURCE_A_PREFERRED' as any, confidence: 'HIGH' as any, reviewerNotes: 'الديوان المحقق أقدم وأوثق' },
      'owner-1',
    );

    const arg = prisma.sourceConflict.update.mock.calls[0][0];
    expect(arg.data.reviewedById).toBe('owner-1');
    expect(arg.data.resolvedAt).toBeInstanceOf(Date);
  });

  it('إعادة الخلاف إلى PENDING تمسح وقت الحسم بدل تركه قيمة قديمة مضللة', async () => {
    prisma.sourceConflict.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.sourceConflict.update.mockResolvedValue({ id: 'c1' });

    await service.resolve('c1', { resolution: 'PENDING' as any, confidence: 'UNRESOLVED' as any }, 'owner-1');

    expect(prisma.sourceConflict.update.mock.calls[0][0].data.resolvedAt).toBeNull();
  });

  it('العرض العام يستبعد الخلافات المحسومة بترجيح، ولا يسرّب ملاحظات المراجع', async () => {
    prisma.sourceConflict.findMany.mockResolvedValue([
      {
        subject: 'نسبة البيت',
        conflictType: 'ATTRIBUTION',
        publicDisputeNote: 'اختلف المصدران في نسبة البيت',
        confidence: 'LOW',
        reviewerNotes: 'ملاحظة داخلية لا تخرج للعامة',
        sourceA: { title: 'ديوان محقق', author: 'أ' },
        sourceB: { title: 'مجموع شعري', author: 'ب' },
        sourceAClaim: 'لامرئ القيس',
        sourceBClaim: 'لطرفة',
      },
    ]);

    const result = await service.publicNotesFor('POEM' as any, 'poem-1');

    const where = prisma.sourceConflict.findMany.mock.calls[0][0].where;
    expect(where.resolution.in).toEqual(
      expect.arrayContaining(['PENDING', 'BOTH_PUBLISHED_AS_DISPUTED', 'INSUFFICIENT_EVIDENCE']),
    );
    expect(where.resolution.in).not.toContain('SOURCE_A_PREFERRED');

    expect(result[0].positions).toHaveLength(2);
    expect(JSON.stringify(result)).not.toContain('ملاحظة داخلية');
  });
});
