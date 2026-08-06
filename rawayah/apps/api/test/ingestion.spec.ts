import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IngestionService } from '../src/modules/ingestion/ingestion.service';
import { DuplicateDetectionService } from '../src/modules/ingestion/duplicate-detection.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';

describe('IngestionService — لا نشر تلقائي، ولا نشر بلا مصدر (سيناريوهات 5، 6، 8، 9)', () => {
  let service: IngestionService;
  let duplicates: { findCandidates: jest.Mock };
  let prisma: any;
  let recordStore: Record<string, any>;

  beforeEach(async () => {
    recordStore = {};
    let counter = 0;

    prisma = {
      ingestionJob: {
        findUnique: jest.fn().mockResolvedValue({ id: 'job1', startedAt: null }),
        update: jest.fn().mockResolvedValue({}),
      },
      ingestionRecord: {
        create: jest.fn(async ({ data }: any) => {
          const id = `rec-${++counter}`;
          const row = { id, ...data };
          recordStore[id] = row;
          return row;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          recordStore[where.id] = { ...recordStore[where.id], ...data };
          return recordStore[where.id];
        }),
        findUnique: jest.fn(async ({ where }: any) => recordStore[where.id] ?? null),
        findMany: jest.fn(async ({ where }: any) =>
          Object.values(recordStore).filter((r) => !where?.id || where.id.in.includes(r.id)),
        ),
      },
      duplicateCandidate: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      validationResult: { create: jest.fn().mockResolvedValue({}) },
      publishingBatch: {
        create: jest.fn().mockResolvedValue({ id: 'batch-1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'batch-1', records: [] }),
      },
      poem: { create: jest.fn().mockResolvedValue({ id: 'poem-new-1' }) },
    };

    duplicates = { findCandidates: jest.fn().mockResolvedValue([]) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: PrismaService, useValue: prisma },
        { provide: DuplicateDetectionService, useValue: duplicates },
      ],
    }).compile();
    service = moduleRef.get(IngestionService);
  });

  it('يرفض تلقائيًا سجلًا بلا أي إشارة مصدر — لا يصل لمرحلة المراجعة البشرية', async () => {
    const { records } = await service.stageRecords('job1', [
      { targetContentType: 'POEM', rawData: { title: 'قصيدة بلا مصدر' } },
    ]);

    expect(records[0].stage).toBe('REJECTED');
    expect(records[0].rejectionReason).toContain('لا يوجد مصدر');
  });

  it('يوقف سجلًا يملك إشارة مصدر عند "قيد المراجعة البشرية" فقط — لا ينشر تلقائيًا', async () => {
    const { records } = await service.stageRecords('job1', [
      { targetContentType: 'POEM', rawData: { title: 'قصيدة موثقة', sourceTitle: 'ديوان كذا' } },
    ]);

    expect(records[0].stage).toBe('HUMAN_REVIEW');
  });

  it('يسجّل مرشحي تكرار عند وجود تشابه دون رفض السجل تلقائيًا', async () => {
    duplicates.findCandidates.mockResolvedValue([
      { existingContentId: 'poem-old-1', existingTitle: 'قصيدة مشابهة', similarityScore: 0.7, matchReason: 'تشابه أسماء' },
    ]);

    const { records } = await service.stageRecords('job1', [
      { targetContentType: 'POEM', rawData: { title: 'قصيدة مشابهة جدًا', sourceTitle: 'مصدر ما' } },
    ]);

    expect(prisma.duplicateCandidate.createMany).toHaveBeenCalled();
    expect(records[0].stage).toBe('HUMAN_REVIEW'); // التكرار يُسجَّل كمرشح، لا يمنع المراجعة اليدوية
  });

  it('يمنع اعتماد سجل ليس في مرحلة HUMAN_REVIEW', async () => {
    recordStore['rec-x'] = { id: 'rec-x', stage: 'NORMALIZED' };
    await expect(service.approveRecord('rec-x')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('يمنع نشر دفعة تحتوي سجلًا واحدًا غير معتمد (سيناريو 8)', async () => {
    recordStore['rec-a'] = { id: 'rec-a', stage: 'APPROVED', targetContentType: 'POEM', normalizedData: {} };
    recordStore['rec-b'] = { id: 'rec-b', stage: 'HUMAN_REVIEW', targetContentType: 'POEM', normalizedData: {} };

    await expect(
      service.publishBatch({ label: 'دفعة اختبار', recordIds: ['rec-a', 'rec-b'] }, 'owner-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.poem.create).not.toHaveBeenCalled();
  });

  it('ينشر السجلات المعتمدة كمسودات (status=DRAFT) لا كمنشورة مباشرة', async () => {
    recordStore['rec-a'] = { id: 'rec-a', jobId: 'job1', stage: 'APPROVED', targetContentType: 'POEM', normalizedData: { title: 'قصيدة جاهزة' } };

    await service.publishBatch({ label: 'دفعة اختبار', recordIds: ['rec-a'] }, 'owner-1');

    expect(prisma.poem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DRAFT', createdBy: 'owner-1' }) }),
    );
  });
});
