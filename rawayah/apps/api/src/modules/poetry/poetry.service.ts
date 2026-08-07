import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { MediaCategory, StorageService } from '../../shared/media/storage.service';
import { trigramSimilarity } from '../../shared/common/arabic-normalize';
import {
  CreatePoetFileItemDto,
  CreateTaxonomyTermDto,
  MergeTaxonomyTermDto,
  ReorderTaxonomyDto,
  ReviewPoetFileItemDto,
  SetPoemTaxonomyDto,
  SetPoetFileItemRightsDto,
  UpdateTaxonomyTermDto,
  UpsertPoetFileDto,
} from './dto/poetry.dto';

// أنواع المواد التي تُعد وسائط وتخضع لبوابة الحقوق قبل النشر.
const MEDIA_KINDS = ['AUDIO', 'VIDEO', 'IMAGE', 'DOCUMENT'];

// حالات الحقوق التي تسمح وحدها بالنشر العلني.
const PUBLISHABLE_RIGHTS = ['PUBLIC_DOMAIN', 'LICENSED', 'PERMISSION_GRANTED'];

// ربط نوع المادة بفئة التخزين التي تحدد الأنواع والأحجام المسموحة.
const KIND_TO_STORAGE_CATEGORY: Record<string, MediaCategory> = {
  AUDIO: 'audio',
  VIDEO: 'video',
  IMAGE: 'image',
  DOCUMENT: 'document',
};

@Injectable()
export class PoetryService {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  // رفع ملف مادة لمكتبة شاعر. يستخدمه المالك والمساهم المعتمد معًا.
  // الملف يُخزَّن كخاص دائمًا (isPrivate) لأن المادة لم تُراجع ولم تُنشر بعد،
  // ولأن حالة حقوقها ما زالت مجهولة — فلا يجوز أن يكون رابطها عامًا.
  async uploadPoetFileMedia(
    poetId: string,
    kind: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
    userId: string,
  ) {
    const category = KIND_TO_STORAGE_CATEGORY[kind];
    if (!category) {
      throw new BadRequestException('نوع المادة لا يقبل رفع ملف — استخدم نصًا أو رابطًا خارجيًا');
    }

    const poetFile = await this.prisma.poetFile.findUnique({ where: { poetId } });
    if (!poetFile) throw new NotFoundException('لا توجد مكتبة لهذا الشاعر — أنشئها أولًا');

    const saved = await this.storage.save(file, category, 'poet-files');

    await this.prisma.mediaFile.create({
      data: {
        contentType: 'POET_FILE_ITEM',
        contentId: poetFile.id,
        mimeType: saved.mimeType,
        url: saved.storageKey,
        size: saved.size,
        originalName: saved.originalName,
        storageKey: saved.storageKey,
        uploadedBy: userId,
        isPrivate: true,
      },
    });

    return { mediaUrl: saved.storageKey, originalName: saved.originalName, size: saved.size };
  }

  // ============ التصنيفات ============

  // القراءة العامة: التصنيفات الفعّالة غير المدموجة فقط، مرتبة ومجمّعة حسب البعد.
  async listTaxonomy(dimension?: string) {
    const terms = await this.prisma.poetryTaxonomyTerm.findMany({
      where: {
        isActive: true,
        mergedIntoId: null,
        ...(dimension ? { dimension: dimension as any } : {}),
      },
      orderBy: [{ dimension: 'asc' }, { sortOrder: 'asc' }, { nameAr: 'asc' }],
      select: {
        id: true,
        slug: true,
        nameAr: true,
        description: true,
        dimension: true,
        parentId: true,
        sortOrder: true,
      },
    });

    const grouped: Record<string, typeof terms> = {};
    for (const t of terms) {
      (grouped[t.dimension] ??= []).push(t);
    }
    return { dimensions: grouped, total: terms.length };
  }

  // عرض المالك: يشمل المخفي والمدموج لأنه يديرها.
  listTaxonomyForOwner() {
    return this.prisma.poetryTaxonomyTerm.findMany({
      orderBy: [{ dimension: 'asc' }, { sortOrder: 'asc' }],
      include: { _count: { select: { poems: true, children: true } } },
    });
  }

  async createTaxonomyTerm(dto: CreateTaxonomyTermDto) {
    const existing = await this.prisma.poetryTaxonomyTerm.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('المعرّف المختصر مستخدم بالفعل');

    if (dto.parentId) {
      const parent = await this.prisma.poetryTaxonomyTerm.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('التصنيف الأب غير موجود');
      if (parent.dimension !== dto.dimension) {
        throw new BadRequestException('التصنيف الفرعي يجب أن يكون ضمن نفس بُعد التصنيف الأب');
      }
    }

    return this.prisma.poetryTaxonomyTerm.create({
      data: {
        slug: dto.slug,
        nameAr: dto.nameAr,
        dimension: dto.dimension as any,
        description: dto.description,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateTaxonomyTerm(id: string, dto: UpdateTaxonomyTermDto) {
    const term = await this.prisma.poetryTaxonomyTerm.findUnique({ where: { id } });
    if (!term) throw new NotFoundException('التصنيف غير موجود');

    // منع جعل التصنيف أبًا لنفسه أو لأحد أبنائه (حلقة لا نهائية في الشجرة).
    if (dto.parentId) {
      if (dto.parentId === id) throw new BadRequestException('لا يمكن جعل التصنيف أبًا لنفسه');
      let cursor = await this.prisma.poetryTaxonomyTerm.findUnique({ where: { id: dto.parentId } });
      let depth = 0;
      while (cursor?.parentId && depth < 20) {
        if (cursor.parentId === id) {
          throw new BadRequestException('لا يمكن جعل تصنيف فرعي أبًا لتصنيفه الأصل');
        }
        cursor = await this.prisma.poetryTaxonomyTerm.findUnique({ where: { id: cursor.parentId } });
        depth++;
      }
    }

    return this.prisma.poetryTaxonomyTerm.update({ where: { id }, data: dto });
  }

  // الدمج لا يحذف التصنيف القديم: ينقل قصائده إلى الجديد ويبقيه مع إشارة
  // mergedIntoId حتى لا تنكسر أي روابط أو مرجعيات خارجية.
  async mergeTaxonomyTerm(id: string, dto: MergeTaxonomyTermDto) {
    if (id === dto.targetTermId) throw new BadRequestException('لا يمكن دمج التصنيف مع نفسه');

    const [from, to] = await Promise.all([
      this.prisma.poetryTaxonomyTerm.findUnique({ where: { id } }),
      this.prisma.poetryTaxonomyTerm.findUnique({ where: { id: dto.targetTermId } }),
    ]);
    if (!from) throw new NotFoundException('التصنيف المصدر غير موجود');
    if (!to) throw new NotFoundException('التصنيف الهدف غير موجود');
    if (from.dimension !== to.dimension) {
      throw new BadRequestException('لا يمكن الدمج بين تصنيفين من بُعدين مختلفين');
    }

    return this.prisma.$transaction(async (tx) => {
      const links = await tx.poemTaxonomy.findMany({ where: { termId: id } });
      for (const link of links) {
        const exists = await tx.poemTaxonomy.findUnique({
          where: { poemId_termId: { poemId: link.poemId, termId: dto.targetTermId } },
        });
        if (exists) {
          await tx.poemTaxonomy.delete({ where: { id: link.id } });
        } else {
          await tx.poemTaxonomy.update({ where: { id: link.id }, data: { termId: dto.targetTermId } });
        }
      }
      return tx.poetryTaxonomyTerm.update({
        where: { id },
        data: { mergedIntoId: dto.targetTermId, isActive: false },
      });
    });
  }

  async reorderTaxonomy(dto: ReorderTaxonomyDto) {
    await this.prisma.$transaction(
      dto.orderedIds.map((termId, index) =>
        this.prisma.poetryTaxonomyTerm.update({ where: { id: termId }, data: { sortOrder: index + 1 } }),
      ),
    );
    return { updated: dto.orderedIds.length };
  }

  // ============ ربط القصيدة بالتصنيفات ============

  async setPoemTaxonomy(poemId: string, dto: SetPoemTaxonomyDto) {
    const poem = await this.prisma.poem.findUnique({ where: { id: poemId } });
    if (!poem) throw new NotFoundException('القصيدة غير موجودة');

    const terms = await this.prisma.poetryTaxonomyTerm.findMany({
      where: { id: { in: dto.termIds } },
    });
    if (terms.length !== dto.termIds.length) {
      throw new BadRequestException('أحد التصنيفات المرسلة غير موجود');
    }
    const merged = terms.find((t) => t.mergedIntoId);
    if (merged) {
      throw new BadRequestException(`التصنيف "${merged.nameAr}" مدموج في تصنيف آخر — استخدم التصنيف الهدف`);
    }

    await this.prisma.$transaction([
      this.prisma.poemTaxonomy.deleteMany({ where: { poemId } }),
      this.prisma.poemTaxonomy.createMany({
        data: dto.termIds.map((termId) => ({ poemId, termId })),
      }),
    ]);

    return this.getPoemTaxonomy(poemId);
  }

  async getPoemTaxonomy(poemId: string) {
    const links = await this.prisma.poemTaxonomy.findMany({
      where: { poemId },
      include: { term: true },
    });
    const byDimension: Record<string, Array<{ id: string; slug: string; nameAr: string }>> = {};
    for (const l of links) {
      (byDimension[l.term.dimension] ??= []).push({
        id: l.term.id,
        slug: l.term.slug,
        nameAr: l.term.nameAr,
      });
    }
    return byDimension;
  }

  // تصفح القصائد المنشورة ضمن تصنيف معيّن.
  async listPoemsByTerm(slug: string) {
    const term = await this.prisma.poetryTaxonomyTerm.findUnique({ where: { slug } });
    if (!term) throw new NotFoundException('التصنيف غير موجود');

    // إذا كان التصنيف مدموجًا، اعرض محتوى التصنيف الهدف بدل قائمة فارغة.
    const effectiveId = term.mergedIntoId ?? term.id;

    const links = await this.prisma.poemTaxonomy.findMany({
      where: { termId: effectiveId, poem: { status: 'PUBLISHED', deletedAt: null } },
      include: { poem: { select: { id: true, slug: true, title: true, summary: true, poetId: true } } },
      take: 200,
    });

    return {
      term: { id: term.id, slug: term.slug, nameAr: term.nameAr, dimension: term.dimension },
      mergedInto: term.mergedIntoId,
      poems: links.map((l) => l.poem),
    };
  }

  // ============ مكتبة الشاعر ============

  async upsertPoetFile(poetId: string, dto: UpsertPoetFileDto, userId: string) {
    const poet = await this.prisma.poet.findUnique({ where: { id: poetId } });
    if (!poet) throw new NotFoundException('الشاعر غير موجود');

    return this.prisma.poetFile.upsert({
      where: { poetId },
      update: { overview: dto.overview },
      create: { poetId, overview: dto.overview, createdBy: userId },
    });
  }

  // مكتبة الشاعر العامة: المواد المنشورة فقط، مقسّمة إلى تبويبات.
  // التبويب الفارغ لا يُعاد إطلاقًا حتى لا تعرض الواجهة تبويبًا بلا محتوى.
  async getPublicPoetLibrary(poetId: string) {
    const poet = await this.prisma.poet.findUnique({
      where: { id: poetId },
      select: {
        id: true,
        slug: true,
        fullName: true,
        knownAs: true,
        kunya: true,
        laqab: true,
        imageUrl: true,
        summary: true,
        biography: true,
        birthDate: true,
        deathDate: true,
        birthDatePrecision: true,
        deathDatePrecision: true,
        disputeNote: true,
        era: true,
        region: true,
        verificationLevel: true,
        lastReviewedAt: true,
        status: true,
      },
    });
    if (!poet || poet.status !== 'PUBLISHED') throw new NotFoundException('الشاعر غير موجود');

    const file = await this.prisma.poetFile.findUnique({ where: { poetId } });

    const items = file
      ? await this.prisma.poetFileItem.findMany({
          where: { poetFileId: file.id, status: 'PUBLISHED' },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            kind: true,
            title: true,
            description: true,
            bodyText: true,
            mediaUrl: true,
            externalUrl: true,
            poemId: true,
            occasion: true,
            materialDate: true,
            materialDatePrecision: true,
            reciterName: true,
            documentationLevel: true,
            allowDownload: true,
            licenseName: true,
            rightsHolder: true,
            contributedBy: { select: { profile: { select: { displayName: true } } } },
          },
        })
      : [];

    // المادة هنا PUBLISHED فعلًا (حقوقها كُشفت في بوابة النشر)، فتُستخدم
    // مدة الصلاحية العامة الأطول لا الخاصة القصيرة.
    const itemsWithResolvedMedia = await this.resolveItemsMediaUrls(items, false);

    const poems = await this.prisma.poem.findMany({
      where: { poetId, status: 'PUBLISHED', deletedAt: null },
      select: { id: true, slug: true, title: true, summary: true },
      take: 200,
    });

    const stories = await this.prisma.story.findMany({
      where: { poetId, status: 'PUBLISHED', deletedAt: null },
      select: { id: true, slug: true, title: true, summary: true },
      take: 100,
    });

    const sources = await this.prisma.contentSource.findMany({
      where: { contentType: 'POET', contentId: poetId },
      include: { source: { select: { id: true, title: true, author: true, link: true, tier: true } } },
    });

    const nameVariants = await this.prisma.nameVariant.findMany({
      where: { contentType: 'POET', contentId: poetId },
      select: { name: true, variantType: true },
    });

    const relations = await this.prisma.entityRelation.findMany({
      where: { sourceType: 'POET', sourceId: poetId },
      select: { targetType: true, targetId: true, relationType: true, label: true, confidence: true },
      take: 100,
    });

    // الروايات المختلفة للشاعر ولقصائده. تُجمَّع حسب الموضوع الذي تتناوله
    // ولا تُلغى رواية لصالح أخرى — تُعرض جميعها مع نقاط الاختلاف ومستوى
    // التوثيق، لأن المنصة لا تحسم خلافًا تاريخيًا لا دليل كافيًا لحسمه.
    const poemIds = poems.map((p) => p.id);
    const narrationRows = await this.prisma.narration.findMany({
      where: {
        OR: [
          { contentType: 'POET', contentId: poetId },
          ...(poemIds.length ? [{ contentType: 'POEM' as const, contentId: { in: poemIds } }] : []),
        ],
      },
      include: { source: { select: { id: true, title: true, author: true, tier: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    const poemTitles = new Map(poems.map((p) => [p.id, p.title]));
    const narrationGroups = Object.values(
      narrationRows.reduce<Record<string, any>>((acc, n) => {
        const key = `${n.contentType}:${n.contentId}`;
        acc[key] ??= {
          subjectType: n.contentType,
          subjectId: n.contentId,
          subjectTitle:
            n.contentType === 'POET' ? poet.fullName : poemTitles.get(n.contentId) ?? 'موضوع مرتبط',
          narrations: [],
        };
        acc[key].narrations.push({
          id: n.id,
          label: n.label,
          body: n.body,
          differenceNote: n.differenceNote,
          verificationLevel: n.verificationLevel,
          documentedAt: n.createdAt,
          source: n.source,
        });
        return acc;
      }, {}),
    )
      // الموضوع الذي له رواية واحدة فقط لا يُعد "اختلاف روايات".
      .filter((g: any) => g.narrations.length > 1);

    // بناء التبويبات — لا يُضاف تبويب إلا إذا كان فيه محتوى فعلي.
    const tabs: Array<{ key: string; label: string; count: number }> = [];
    const add = (key: string, label: string, count: number) => {
      if (count > 0) tabs.push({ key, label, count });
    };

    const audios = itemsWithResolvedMedia.filter((i) => i.kind === 'AUDIO');
    const videos = itemsWithResolvedMedia.filter((i) => i.kind === 'VIDEO');
    const images = itemsWithResolvedMedia.filter((i) => i.kind === 'IMAGE');
    const documents = itemsWithResolvedMedia.filter((i) => i.kind === 'DOCUMENT');
    const links = itemsWithResolvedMedia.filter((i) => i.kind === 'EXTERNAL_LINK');
    const texts = itemsWithResolvedMedia.filter((i) => i.kind === 'TEXT');

    add('overview', 'نبذة', poet.biography || poet.summary || file?.overview ? 1 : 0);
    add('poems', 'القصائد', poems.length + texts.length);
    add('audio', 'الصوتيات', audios.length);
    add('video', 'الفيديو', videos.length);
    add('images', 'الصور', images.length);
    add('documents', 'الوثائق', documents.length);
    add('stories', 'القصص', stories.length);
    add('narrations', 'اختلاف الروايات', narrationGroups.length);
    add('links', 'روابط', links.length);
    add('sources', 'المصادر', sources.length);

    return {
      poet,
      nameVariants,
      overview: file?.overview ?? null,
      tabs,
      narrationGroups,
      poems,
      texts,
      audios,
      videos,
      images,
      documents,
      links,
      stories,
      relations,
      sources: sources.map((s) => s.source),
    };
  }

  // عرض المالك: كل المواد بكل حالاتها، لأنه يراجعها.
  async getOwnerPoetLibrary(poetId: string) {
    const file = await this.prisma.poetFile.findUnique({
      where: { poetId },
      include: {
        items: {
          orderBy: [{ createdAt: 'desc' }],
          include: {
            contributedBy: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
            reviewedBy: { select: { id: true, email: true } },
          },
        },
      },
    });
    if (!file) throw new NotFoundException('لا توجد مكتبة لهذا الشاعر بعد');

    // مواد قيد المراجعة تحديدًا (حقوقها غير محسومة بعد) — تُعامل كخاصة
    // مطابقةً لحالتها الفعلية وقت الرفع.
    return { ...file, items: await this.resolveItemsMediaUrls(file.items, true) };
  }

  // إضافة مادة. يستخدمها المالك والمساهم المعتمد معًا، والفرق أن
  // المادة تبدأ دائمًا بحالة DRAFT/SUBMITTED ولا تُنشر هنا إطلاقًا.
  async addPoetFileItem(poetId: string, dto: CreatePoetFileItemDto, userId: string) {
    const file = await this.prisma.poetFile.findUnique({ where: { poetId } });
    if (!file) throw new NotFoundException('لا توجد مكتبة لهذا الشاعر — أنشئها أولًا');

    if (dto.kind === 'TEXT' && !dto.bodyText?.trim()) {
      throw new BadRequestException('المادة النصية تتطلب نصًا');
    }
    if (dto.kind === 'EXTERNAL_LINK' && !dto.externalUrl?.trim()) {
      throw new BadRequestException('الرابط الخارجي مطلوب');
    }
    if (MEDIA_KINDS.includes(dto.kind) && !dto.mediaUrl?.trim()) {
      throw new BadRequestException('ملف الوسائط مطلوب لهذا النوع');
    }
    if (dto.poemId) {
      const poem = await this.prisma.poem.findUnique({ where: { id: dto.poemId } });
      if (!poem) throw new NotFoundException('القصيدة المرتبطة غير موجودة');
    }

    return this.prisma.poetFileItem.create({
      data: {
        poetFileId: file.id,
        kind: dto.kind as any,
        title: dto.title,
        description: dto.description,
        bodyText: dto.bodyText,
        mediaUrl: dto.mediaUrl,
        externalUrl: dto.externalUrl,
        poemId: dto.poemId,
        occasion: dto.occasion,
        materialDate: dto.materialDate,
        reciterName: dto.reciterName,
        capturedByName: dto.capturedByName,
        sourceId: dto.sourceId,
        sourceNotes: dto.sourceNotes,
        rightsHolder: dto.rightsHolder,
        licenseName: dto.licenseName,
        contributedById: userId,
        // الحقوق تبدأ دائمًا UNKNOWN ولا يحددها المساهم — المالك وحده يضبطها.
        rightsStatus: 'UNKNOWN',
        allowDisplay: false,
        reviewState: 'DRAFT',
        status: 'DRAFT',
      },
    });
  }

  // إرسال المادة للمراجعة. المساهم لا يعدّل إلا مادته هو.
  async submitPoetFileItem(itemId: string, userId: string, isOwner: boolean) {
    const item = await this.prisma.poetFileItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('المادة غير موجودة');
    if (!isOwner && item.contributedById !== userId) {
      throw new ForbiddenException('لا يمكنك تعديل مادة أضافها مساهم آخر');
    }
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(item.reviewState)) {
      throw new BadRequestException('المادة ليست في حالة تسمح بالإرسال للمراجعة');
    }

    return this.prisma.poetFileItem.update({
      where: { id: itemId },
      data: { reviewState: 'SUBMITTED', status: 'SUBMITTED' },
    });
  }

  // ضبط الحقوق — المالك حصرًا (مفروض بالصلاحية على المتحكم).
  async setPoetFileItemRights(itemId: string, dto: SetPoetFileItemRightsDto, userId: string) {
    const item = await this.prisma.poetFileItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('المادة غير موجودة');

    const updated = await this.prisma.poetFileItem.update({
      where: { id: itemId },
      data: {
        rightsStatus: dto.rightsStatus as any,
        rightsHolder: dto.rightsHolder ?? item.rightsHolder,
        licenseName: dto.licenseName ?? item.licenseName,
        allowDisplay: dto.allowDisplay ?? item.allowDisplay,
        allowDownload: dto.allowDownload ?? item.allowDownload,
        allowCommercial: dto.allowCommercial ?? item.allowCommercial,
      },
    });

    await this.prisma.rightsRecord.upsert({
      where: { contentType_contentId: { contentType: 'POET_FILE_ITEM', contentId: itemId } },
      update: { status: dto.rightsStatus as any, licenseName: dto.licenseName, grantedByName: dto.rightsHolder, recordedById: userId },
      create: {
        contentType: 'POET_FILE_ITEM',
        contentId: itemId,
        status: dto.rightsStatus as any,
        licenseName: dto.licenseName,
        grantedByName: dto.rightsHolder,
        recordedById: userId,
      },
    });

    return updated;
  }

  async reviewPoetFileItem(itemId: string, dto: ReviewPoetFileItemDto, userId: string) {
    const item = await this.prisma.poetFileItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('المادة غير موجودة');

    const map = {
      APPROVED: { reviewState: 'APPROVED', status: 'VERIFIED' },
      CHANGES_REQUESTED: { reviewState: 'CHANGES_REQUESTED', status: 'NEEDS_REVISION' },
      REJECTED: { reviewState: 'REJECTED', status: 'REJECTED' },
    } as const;
    const next = map[dto.decision];

    return this.prisma.poetFileItem.update({
      where: { id: itemId },
      data: {
        reviewState: next.reviewState as any,
        status: next.status as any,
        reviewedById: userId,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes,
      },
    });
  }

  // النشر — المالك حصرًا، وهنا تُطبَّق بوابة الحقوق فعليًا.
  async publishPoetFileItem(itemId: string, userId: string) {
    const item = await this.prisma.poetFileItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('المادة غير موجودة');

    if (item.reviewState !== 'APPROVED') {
      throw new BadRequestException('لا يمكن نشر مادة لم تُعتمد بعد في المراجعة');
    }

    // بوابة الحقوق: لا نشر لأي وسائط ما لم تسمح حالة حقوقها صراحةً.
    if (MEDIA_KINDS.includes(item.kind)) {
      if (!PUBLISHABLE_RIGHTS.includes(item.rightsStatus)) {
        throw new BadRequestException(
          'لا يجوز نشر هذه المادة: حالة الحقوق لا تسمح بالنشر. حدّد حالة الحقوق أولًا',
        );
      }
      if (!item.allowDisplay) {
        throw new BadRequestException('لا يجوز نشر هذه المادة: العرض غير مسموح به في سجل الحقوق');
      }
    }

    return this.prisma.poetFileItem.update({
      where: { id: itemId },
      data: {
        reviewState: 'PUBLISHED',
        status: 'PUBLISHED',
        publishedById: userId,
        publishedAt: new Date(),
      },
    });
  }

  // قائمة المواد المنتظرة لمراجعة المالك، مع تنبيهات آلية مساعِدة.
  //
  // التنبيهات **لا تقرر شيئًا** ولا تحجب النشر — هي مساعدة كشف فقط
  // (تكرار محتمل، بيانات ناقصة). القرار النهائي للمالك وحده، تنفيذًا
  // لشرط عدم ترك الأدوات الآلية تحسم النشر.
  async listPendingReview() {
    const items = await this.prisma.poetFileItem.findMany({
      where: { reviewState: { in: ['SUBMITTED', 'OWNER_REVIEW'] } },
      orderBy: { updatedAt: 'asc' },
      include: {
        poetFile: { include: { poet: { select: { id: true, fullName: true } } } },
        contributedBy: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
      },
    });

    const withChecks = await Promise.all(
      items.map(async (item) => ({ ...item, checks: await this.runChecks(item) })),
    );
    // مواد قيد المراجعة أيضًا — لم تُنشر بعد، فتُعامل كخاصة.
    return this.resolveItemsMediaUrls(withChecks, true);
  }

  // mediaUrl المخزَّن في قاعدة البيانات هو مفتاح التخزين (storageKey) لا
  // رابطًا قابلاً للعرض مباشرة — لا يُخزَّن رابط ثابت لأنه ينتهي، بل
  // يُحسب رابط موقَّع جديد عند كل قراءة (نفس نمط MediaService الموجود).
  // isPrivate يحدد مدة الصلاحية فقط (15 دقيقة/24 ساعة) لا إمكانية
  // الوصول نفسها، لأن الروابط الموقَّعة لا تعتمد على ACL علني للحاوية.
  private async resolveItemsMediaUrls<T extends { kind: string; mediaUrl?: string | null }>(
    items: T[],
    isPrivate: boolean,
  ): Promise<T[]> {
    return Promise.all(
      items.map(async (item) => {
        if (!MEDIA_KINDS.includes(item.kind) || !item.mediaUrl) return item;
        try {
          return { ...item, mediaUrl: await this.storage.getSignedDownloadUrl(item.mediaUrl, isPrivate) };
        } catch {
          // ملف مفقود أو تعذّر التوقيع — تُعرض المادة بلا رابط بدل كسر الصفحة كاملة.
          return { ...item, mediaUrl: null };
        }
      }),
    );
  }

  // فحوصات مساعدة على مادة واحدة.
  private async runChecks(item: any) {
    const checks: Array<{ type: string; severity: 'info' | 'warning'; message: string }> = [];

    // 1) تكرار محتمل داخل نفس مكتبة الشاعر (عنوانًا أو نصًا).
    const siblings = await this.prisma.poetFileItem.findMany({
      where: { poetFileId: item.poetFileId, id: { not: item.id } },
      select: { id: true, title: true, bodyText: true, status: true },
      take: 200,
    });

    for (const other of siblings) {
      const titleScore = trigramSimilarity(item.title ?? '', other.title ?? '');
      if (titleScore >= 0.8) {
        checks.push({
          type: 'DUPLICATE_TITLE',
          severity: 'warning',
          message: `عنوان قريب جدًا من مادة موجودة: «${other.title}» (تشابه ${Math.round(titleScore * 100)}%)`,
        });
        continue;
      }
      if (item.bodyText && other.bodyText) {
        const bodyScore = trigramSimilarity(item.bodyText, other.bodyText);
        if (bodyScore >= 0.85) {
          checks.push({
            type: 'DUPLICATE_BODY',
            severity: 'warning',
            message: `نص قريب جدًا من مادة موجودة: «${other.title}» (تشابه ${Math.round(bodyScore * 100)}%)`,
          });
        }
      }
    }

    // 2) بيانات توثيق ناقصة.
    if (!item.sourceId && !item.sourceNotes) {
      checks.push({
        type: 'MISSING_SOURCE',
        severity: 'warning',
        message: 'لا يوجد مصدر ولا ملاحظات مصدر لهذه المادة',
      });
    }
    if (MEDIA_KINDS.includes(item.kind) && !PUBLISHABLE_RIGHTS.includes(item.rightsStatus)) {
      checks.push({
        type: 'RIGHTS_NOT_SET',
        severity: 'warning',
        message: 'حالة الحقوق لا تسمح بالنشر — يجب ضبطها قبل النشر',
      });
    }
    if ((item.kind === 'AUDIO' || item.kind === 'VIDEO') && !item.reciterName) {
      checks.push({
        type: 'MISSING_RECITER',
        severity: 'info',
        message: 'لم يُذكر الراوي أو الملقي',
      });
    }
    if (!item.materialDate) {
      checks.push({ type: 'MISSING_DATE', severity: 'info', message: 'لا يوجد تاريخ للمادة' });
    }

    return checks;
  }

  // مواد المساهم نفسه مع حالاتها — ليتابع مراجعته.
  listMyContributions(userId: string) {
    return this.prisma.poetFileItem.findMany({
      where: { contributedById: userId },
      orderBy: { updatedAt: 'desc' },
      include: { poetFile: { include: { poet: { select: { id: true, fullName: true } } } } },
    });
  }
}
