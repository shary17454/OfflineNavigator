import { BadRequestException, Injectable } from '@nestjs/common';
import { ConflictResolution, ContentType } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateSourceConflictDto, ResolveSourceConflictDto } from './dto/source-conflicts.dto';

/// تعارض المصادر.
///
/// المبدأ الحاكم لهذه الخدمة: **الخلاف بيانات تُحفظ، لا مشكلة تُزال**.
/// لا تحسم هذه الخدمة خلافًا تلقائيًا مهما بدا أحد المصدرين أقوى، لأن
/// ترجيح المصادر حكم علمي لا قاعدة برمجية — أعلى مستوى مصدر قد يخطئ،
/// والمصدر الأضعف قد يحفظ رواية صحيحة انفرد بها.
@Injectable()
export class SourceConflictsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSourceConflictDto) {
    if (dto.sourceAId === dto.sourceBId) {
      throw new BadRequestException('لا يقع التعارض بين المصدر ونفسه');
    }

    const [sourceA, sourceB] = await Promise.all([
      this.prisma.source.findUnique({ where: { id: dto.sourceAId } }),
      this.prisma.source.findUnique({ where: { id: dto.sourceBId } }),
    ]);
    if (!sourceA) throw new BadRequestException('المصدر الأول غير موجود');
    if (!sourceB) throw new BadRequestException('المصدر الثاني غير موجود');

    // الربط ببطاقة الثقة إن وُجدت: التعارض المسجَّل يجب أن ينعكس على تقييم
    // الثقة، وإلا بقيت البطاقة تقول "متفق عليه" وفي القاعدة خلاف مسجَّل.
    const trust = await this.prisma.trustAssessment.findUnique({
      where: { contentType_contentId: { contentType: dto.contentType, contentId: dto.contentId } },
    });

    const conflict = await this.prisma.sourceConflict.create({
      data: { ...dto, trustAssessmentId: trust?.id ?? null },
      include: { sourceA: true, sourceB: true },
    });

    if (trust) {
      await this.prisma.trustAssessment.update({
        where: { id: trust.id },
        data: { hasConflictingSources: true, consensusStatus: 'DISPUTED' },
      });
    }

    return conflict;
  }

  list(params: { contentType?: ContentType; contentId?: string; pendingOnly?: boolean }) {
    return this.prisma.sourceConflict.findMany({
      where: {
        contentType: params.contentType,
        contentId: params.contentId,
        resolution: params.pendingOnly ? ConflictResolution.PENDING : undefined,
      },
      include: { sourceA: true, sourceB: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const conflict = await this.prisma.sourceConflict.findUnique({
      where: { id },
      include: { sourceA: true, sourceB: true },
    });
    if (!conflict) throw new BadRequestException('سجل التعارض غير موجود');
    return conflict;
  }

  async resolve(id: string, dto: ResolveSourceConflictDto, reviewerId: string) {
    await this.get(id);

    // النشر بوصفه "مختلفًا فيه" هو الحالة التي يراها القارئ فعلًا، فلا
    // يُسمح بها بلا نص يوضّح له طبيعة الخلاف — وإلا ظهر وسم بلا معنى.
    if (dto.resolution === ConflictResolution.BOTH_PUBLISHED_AS_DISPUTED && !dto.publicDisputeNote?.trim()) {
      throw new BadRequestException('النشر بوصفه مختلفًا فيه يتطلب نص ملاحظة يُعرض للقارئ');
    }

    // الترجيح قرار علمي يُسأل عنه صاحبه، فلا يُقبل بلا تعليل مكتوب.
    const prefers =
      dto.resolution === ConflictResolution.SOURCE_A_PREFERRED ||
      dto.resolution === ConflictResolution.SOURCE_B_PREFERRED;
    if (prefers && !dto.reviewerNotes?.trim()) {
      throw new BadRequestException('ترجيح أحد المصدرين يتطلب تعليلًا مكتوبًا من المراجع');
    }

    return this.prisma.sourceConflict.update({
      where: { id },
      data: {
        ...dto,
        reviewedById: reviewerId,
        resolvedAt: dto.resolution === ConflictResolution.PENDING ? null : new Date(),
      },
      include: { sourceA: true, sourceB: true },
    });
  }

  /// ما يُعرض للقارئ مع المادة: الخلافات غير المحسومة والمنشورة بوصفها
  /// مختلفًا فيها فقط. الخلاف الذي رُجّح فيه مصدر لا يُعرض كخلاف قائم،
  /// وملاحظات المراجع الداخلية لا تخرج للعامة.
  async publicNotesFor(contentType: ContentType, contentId: string) {
    const conflicts = await this.prisma.sourceConflict.findMany({
      where: {
        contentType,
        contentId,
        resolution: {
          in: [
            ConflictResolution.PENDING,
            ConflictResolution.BOTH_PUBLISHED_AS_DISPUTED,
            ConflictResolution.INSUFFICIENT_EVIDENCE,
          ],
        },
      },
      include: {
        sourceA: { select: { title: true, author: true } },
        sourceB: { select: { title: true, author: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return conflicts.map((c) => ({
      subject: c.subject,
      conflictType: c.conflictType,
      note: c.publicDisputeNote,
      confidence: c.confidence,
      positions: [
        { source: c.sourceA.title, author: c.sourceA.author, claim: c.sourceAClaim },
        { source: c.sourceB.title, author: c.sourceB.author, claim: c.sourceBClaim },
      ],
    }));
  }
}
