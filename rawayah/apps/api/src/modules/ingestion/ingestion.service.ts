import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentType } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { normalizeArabic } from '../../shared/common/arabic-normalize';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { CreateIngestionJobDto, CreateIngestionSourceDto, PublishBatchDto, RejectRecordDto, ResolveDuplicateDto, StageRecordDto } from './dto/ingestion.dto';

const MODEL_MAP: Partial<Record<ContentType, string>> = {
  POEM: 'poem',
  STORY: 'story',
  BOOK: 'book',
  POET: 'poet',
  PROVERB: 'proverb',
  VOCABULARY_TERM: 'vocabularyTerm',
  HORSE: 'horse',
  CAMEL: 'camel',
  FALCON: 'falcon',
  PLACE: 'place',
  HISTORICAL_EVENT: 'historicalEvent',
  TRIBE: 'tribe',
  MANUSCRIPT: 'manuscript',
  NARRATOR: 'narrator',
  ARTICLE: 'article',
  TOPIC: 'topic',
};

// حقول تُطبَّع نصيًا تلقائيًا عند التطبيع (إزالة تشكيل/تطويل/مسافات زائدة) إن وُجدت في البيانات الخام.
const NORMALIZABLE_FIELDS = ['title', 'name', 'fullName', 'phrase', 'term', 'summary', 'body'];

@Injectable()
export class IngestionService {
  constructor(private prisma: PrismaService, private duplicates: DuplicateDetectionService) {}

  createSource(dto: CreateIngestionSourceDto) {
    return this.prisma.ingestionSource.create({
      data: {
        name: dto.name,
        organization: dto.organization,
        baseUrl: dto.baseUrl,
        sourceType: dto.sourceType,
        tier: dto.tier ?? 5,
        allowedUseNote: dto.allowedUseNote,
        isApproved: false, // يحتاج اعتماد OWNER صريحًا بعد المراجعة، غير مفعّل تلقائيًا عند الإنشاء.
      },
    });
  }

  approveSource(id: string) {
    return this.prisma.ingestionSource.update({ where: { id }, data: { isApproved: true } });
  }

  listSources() {
    return this.prisma.ingestionSource.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createJob(dto: CreateIngestionJobDto, ownerId: string) {
    if (dto.sourceId) {
      const source = await this.prisma.ingestionSource.findUnique({ where: { id: dto.sourceId } });
      if (!source) throw new BadRequestException('مصدر الاستيراد غير موجود');
      if (!source.isApproved) throw new ForbiddenException('لا يمكن الاستيراد من مصدر لم يُعتمد بعد');
    }

    return this.prisma.ingestionJob.create({
      data: {
        sourceId: dto.sourceId,
        method: dto.method,
        status: 'PENDING',
        notes: dto.notes,
        createdById: ownerId,
      },
    });
  }

  async listJobs() {
    return this.prisma.ingestionJob.findMany({
      include: { source: true, _count: { select: { records: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // المرحلة: COLLECTED → NORMALIZED → DUPLICATE_CHECK → SOURCE_CHECK → HUMAN_REVIEW.
  // لا يوجد مسار برمجي يتجاوز HUMAN_REVIEW تلقائيًا.
  async stageRecords(jobId: string, records: StageRecordDto[]) {
    const job = await this.prisma.ingestionJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('مهمة الاستيراد غير موجودة');

    await this.prisma.ingestionJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: job.startedAt ?? new Date() },
    });

    const results = [];
    for (const record of records) {
      const staged = await this.stageOne(jobId, record);
      results.push(staged);
    }

    const acceptedCount = results.filter((r) => r.stage === 'HUMAN_REVIEW').length;
    const rejectedCount = results.filter((r) => r.stage === 'REJECTED').length;

    await this.prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        recordCount: { increment: records.length },
        acceptedCount: { increment: acceptedCount },
        rejectedCount: { increment: rejectedCount },
      },
    });

    return { total: records.length, acceptedCount, rejectedCount, records: results };
  }

  private async stageOne(jobId: string, input: StageRecordDto) {
    const targetContentType = input.targetContentType as ContentType;
    if (!MODEL_MAP[targetContentType]) {
      throw new BadRequestException(`نوع المحتوى ${input.targetContentType} غير مدعوم في الاستيراد`);
    }

    let record = await this.prisma.ingestionRecord.create({
      data: {
        jobId,
        externalRef: input.externalRef,
        targetContentType,
        stage: 'COLLECTED',
        rawData: input.rawData as any,
      },
    });

    // NORMALIZED
    const normalizedData: Record<string, unknown> = { ...input.rawData };
    for (const field of NORMALIZABLE_FIELDS) {
      const value = normalizedData[field];
      if (typeof value === 'string') normalizedData[field] = normalizeArabic(value) === '' ? value : value.trim();
    }
    record = await this.prisma.ingestionRecord.update({
      where: { id: record.id },
      data: { stage: 'NORMALIZED', normalizedData: normalizedData as any },
    });

    // DUPLICATE_CHECK
    const candidates = await this.duplicates.findCandidates(targetContentType, normalizedData);
    if (candidates.length) {
      await this.prisma.duplicateCandidate.createMany({
        data: candidates.map((c) => ({
          recordId: record.id,
          existingContentType: targetContentType,
          existingContentId: c.existingContentId,
          similarityScore: c.similarityScore,
          matchReason: c.matchReason,
        })),
      });
    }
    record = await this.prisma.ingestionRecord.update({ where: { id: record.id }, data: { stage: 'DUPLICATE_CHECK' } });
    await this.recordCheck(record.id, 'DUPLICATE_RISK', candidates.length === 0, candidates.length ? `${candidates.length} سجل مشابه محتمل` : undefined);

    // SOURCE_CHECK — يجب أن تتضمن البيانات الخام إشارة لمصدر واحد على الأقل (عنوان أو رابط).
    const hasSourceHint = Boolean(input.rawData.sourceTitle || input.rawData.sourceUrl || input.rawData.sourceId);
    record = await this.prisma.ingestionRecord.update({ where: { id: record.id }, data: { stage: 'SOURCE_CHECK' } });
    await this.recordCheck(record.id, 'SUPPORTING_SOURCE', hasSourceHint, hasSourceHint ? undefined : 'لا يوجد مصدر مذكور في البيانات الخام');

    if (!hasSourceHint) {
      record = await this.prisma.ingestionRecord.update({
        where: { id: record.id },
        data: { stage: 'REJECTED', rejectionReason: 'لا يوجد مصدر مذكور — مرفوض تلقائيًا قبل مرحلة المراجعة البشرية' },
      });
      return record;
    }

    // يقف الخط هنا إلزاميًا — لا اعتماد ولا نشر إلا بقرار OWNER صريح لاحقًا.
    record = await this.prisma.ingestionRecord.update({ where: { id: record.id }, data: { stage: 'HUMAN_REVIEW' } });
    return record;
  }

  private recordCheck(recordId: string, checkType: 'DUPLICATE_RISK' | 'SUPPORTING_SOURCE', passed: boolean, note?: string) {
    return this.prisma.validationResult.create({ data: { recordId, checkType, passed, note } });
  }

  listRecords(jobId?: string, stage?: string) {
    return this.prisma.ingestionRecord.findMany({
      where: { jobId, stage: stage as any },
      include: { validationResults: true, duplicateCandidates: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveRecord(recordId: string) {
    const record = await this.prisma.ingestionRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('السجل غير موجود');
    if (record.stage !== 'HUMAN_REVIEW') {
      throw new ForbiddenException('لا يمكن الاعتماد إلا من مرحلة المراجعة البشرية');
    }
    return this.prisma.ingestionRecord.update({ where: { id: recordId }, data: { stage: 'APPROVED' } });
  }

  async rejectRecord(recordId: string, dto: RejectRecordDto) {
    const record = await this.prisma.ingestionRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('السجل غير موجود');
    return this.prisma.ingestionRecord.update({
      where: { id: recordId },
      data: { stage: 'REJECTED', rejectionReason: dto.reason },
    });
  }

  async resolveDuplicate(candidateId: string, ownerId: string, dto: ResolveDuplicateDto) {
    const candidate = await this.prisma.duplicateCandidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('اقتراح التكرار غير موجود');

    // لا حذف تلقائي لأي سجل عند الدمج — القرار يُسجَّل فقط، والدمج الفعلي إجراء يدوي منفصل لصاحب الصلاحية.
    return this.prisma.duplicateCandidate.update({
      where: { id: candidateId },
      data: { status: dto.status, mergeNote: dto.mergeNote, resolvedById: ownerId, resolvedAt: new Date() },
    });
  }

  // ينشر السجلات المعتمدة كمسودات ضمن جداول المحتوى الحقيقية — لا يجعلها PUBLISHED مباشرة،
  // يجب أن تمر لاحقًا بسير المراجعة العادي (submit → review → publish) عبر ModerationService.
  async publishBatch(dto: PublishBatchDto, ownerId: string) {
    const records = await this.prisma.ingestionRecord.findMany({ where: { id: { in: dto.recordIds } } });
    if (records.length !== dto.recordIds.length) throw new BadRequestException('بعض السجلات غير موجودة');
    const notApproved = records.filter((r) => r.stage !== 'APPROVED');
    if (notApproved.length) {
      throw new ForbiddenException(`${notApproved.length} سجل غير معتمد بعد — لا يمكن نشر دفعة تحتوي سجلات غير معتمدة`);
    }

    const batch = await this.prisma.publishingBatch.create({
      data: { jobId: records[0]?.jobId, label: dto.label, publishedById: ownerId },
    });

    for (const record of records) {
      const modelKey = MODEL_MAP[record.targetContentType];
      if (!modelKey) continue;
      const delegate = (this.prisma as unknown as Record<string, any>)[modelKey];
      const data = { ...(record.normalizedData as any), status: 'DRAFT', createdBy: ownerId };
      delete data.sourceTitle;
      delete data.sourceUrl;
      delete data.sourceId;

      const created = await delegate.create({ data });

      await this.prisma.ingestionRecord.update({
        where: { id: record.id },
        data: { stage: 'PUBLISHED', publishedContentId: created.id, publishingBatchId: batch.id },
      });
    }

    return this.prisma.publishingBatch.findUnique({ where: { id: batch.id }, include: { records: true } });
  }

  async rollbackBatch(batchId: string, ownerId: string) {
    const batch = await this.prisma.publishingBatch.findUnique({ where: { id: batchId }, include: { records: true } });
    if (!batch) throw new NotFoundException('الدفعة غير موجودة');
    if (!batch.canRollback) throw new ForbiddenException('لا يمكن التراجع عن هذه الدفعة');

    for (const record of batch.records) {
      const modelKey = MODEL_MAP[record.targetContentType];
      if (!modelKey || !record.publishedContentId) continue;
      const delegate = (this.prisma as unknown as Record<string, any>)[modelKey];
      const current = await delegate.findUnique({ where: { id: record.publishedContentId } });
      // لا نحذف إلا إذا لم تتقدّم الحالة بعد الاستيراد مباشرة (لا تزال مسودة) — حماية من فقدان مراجعات لاحقة.
      if (current?.status === 'DRAFT') {
        await delegate.delete({ where: { id: record.publishedContentId } });
        await this.prisma.ingestionRecord.update({ where: { id: record.id }, data: { stage: 'APPROVED', publishedContentId: null } });
      }
    }

    return this.prisma.publishingBatch.update({
      where: { id: batchId },
      data: { rolledBackAt: new Date(), rolledBackById: ownerId, canRollback: false },
    });
  }
}
