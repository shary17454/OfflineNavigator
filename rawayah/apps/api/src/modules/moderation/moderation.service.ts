import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentType } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

// يربط نوع المحتوى بواجهة Prisma المطابقة له. لا يشمل كل ContentType —
// فقط الأنواع التي تملك حقول سير المراجعة (status/reviewedBy/publishedBy).
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
  HUNTING_ARTICLE: 'huntingArticle',
  HUNTING_DOG_ARTICLE: 'huntingDogArticle',
  ARTICLE: 'article',
  TOPIC: 'topic',
  RECORDING: 'recording',
};

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  private delegate(contentType: ContentType) {
    const key = MODEL_MAP[contentType];
    if (!key) throw new BadRequestException(`نوع المحتوى ${contentType} لا يدعم سير المراجعة`);
    return (this.prisma as unknown as Record<string, any>)[key];
  }

  private async getOrThrow(contentType: ContentType, id: string) {
    const record = await this.delegate(contentType).findUnique({ where: { id } });
    if (!record) throw new NotFoundException('العنصر غير موجود');
    return record;
  }

  async submit(contentType: ContentType, id: string, userId?: string) {
    const existing = await this.getOrThrow(contentType, id);
    if (existing.status !== 'DRAFT' && existing.status !== 'NEEDS_REVISION') {
      throw new ForbiddenException('لا يمكن الإرسال إلا من حالة مسودة أو بحاجة لتعديل');
    }

    const updated = await this.delegate(contentType).update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    await this.log(contentType, id, userId, 'submit', undefined);
    return updated;
  }

  async review(contentType: ContentType, id: string, reviewerId: string, action: 'approve' | 'request_revision' | 'reject', note?: string) {
    await this.getOrThrow(contentType, id);

    const status = action === 'approve' ? 'VERIFIED' : action === 'request_revision' ? 'NEEDS_REVISION' : 'REJECTED';

    const revision = await this.prisma.contentRevision.create({
      data: { contentType, contentId: id, reviewNotes: note, reviewedBy: reviewerId },
    });

    const updated = await this.delegate(contentType).update({
      where: { id },
      data: { status, reviewedBy: reviewerId },
    });

    await this.log(contentType, id, reviewerId, `review.${action}`, note);
    return { record: updated, revisionId: revision.id };
  }

  async publish(contentType: ContentType, id: string, publisherId: string, note?: string) {
    const existing = await this.getOrThrow(contentType, id);
    if (existing.status !== 'VERIFIED' && existing.status !== 'SUBMITTED') {
      throw new ForbiddenException('المحتوى غير جاهز للنشر — يجب أن يكون بحالة "تم التحقق" على الأقل');
    }

    await this.assertHasSource(contentType, id);
    await this.assertMediaRightsClear(contentType, id);

    const updated = await this.delegate(contentType).update({
      where: { id },
      data: { status: 'PUBLISHED', publishedBy: publisherId, publishedAt: new Date() },
    });

    await this.log(contentType, id, publisherId, 'publish', note);
    return updated;
  }

  async hide(contentType: ContentType, id: string, actorId: string, reason: string) {
    await this.getOrThrow(contentType, id);

    const updated = await this.delegate(contentType).update({
      where: { id },
      data: { status: 'HIDDEN' },
    });

    await this.log(contentType, id, actorId, 'hide', reason);
    return updated;
  }

  private async assertHasSource(contentType: ContentType, id: string) {
    const [contentSourceCount, passageSourceCount] = await Promise.all([
      this.prisma.contentSource.count({ where: { contentType, contentId: id } }),
      this.prisma.passage.count({
        where: { contentType, contentId: id, sources: { some: {} } },
      }),
    ]);
    if (contentSourceCount === 0 && passageSourceCount === 0) {
      throw new ForbiddenException('لا يمكن نشر محتوى بلا مصدر موثق واحد على الأقل');
    }
  }

  private async assertMediaRightsClear(contentType: ContentType, id: string) {
    const mediaCount = await this.prisma.mediaFile.count({ where: { contentType, contentId: id } });
    if (mediaCount === 0) return;

    const rights = await this.prisma.rightsRecord.findUnique({
      where: { contentType_contentId: { contentType, contentId: id } },
    });

    const allowed = ['PUBLIC_DOMAIN', 'LICENSED', 'PERMISSION_GRANTED'];
    if (!rights || !allowed.includes(rights.status)) {
      throw new ForbiddenException('لا يمكن نشر محتوى مرتبط بوسائط بلا حالة حقوق واضحة ومسموحة');
    }
  }

  // قائمة موحّدة لكل أنواع المحتوى المدعومة بحالة معيّنة — تُستخدم في لوحة إدارة المراجعة.
  async queue(status: 'SUBMITTED' | 'NEEDS_REVISION' | 'VERIFIED' = 'SUBMITTED', contentType?: ContentType) {
    const types = contentType ? [contentType] : (Object.keys(MODEL_MAP) as ContentType[]);
    const results = await Promise.all(
      types.map(async (type) => {
        const rows = await this.delegate(type).findMany({
          where: { status },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        });
        return rows.map((row: any) => ({ contentType: type, ...row }));
      }),
    );
    return results.flat();
  }

  private async log(contentType: ContentType, entityId: string, actorId: string | undefined, action: string, notes?: string) {
    await Promise.all([
      this.prisma.moderationLog.create({
        data: { actorId: actorId ?? null, action: `${contentType.toLowerCase()}.${action}`, entityType: contentType, entityId, notes: notes || null },
      }),
      this.prisma.auditLog.create({
        data: { actorId: actorId ?? null, action: `moderation.${action}`, entity: contentType, entityId, metadata: notes ? { note: notes } : undefined },
      }),
    ]);
  }
}
