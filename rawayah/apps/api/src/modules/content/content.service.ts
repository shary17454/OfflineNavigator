import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { normalizeArabic } from '../../shared/common/arabic-normalize';
import { ModerationService } from '../moderation/moderation.service';
import {
  CreateCommentDto,
  CreatePoemAttributionDto,
  CreatePoemDto,
  CreatePoemVerseDto,
  CreatePoemVerseVariantDto,
  CreatePoemVersionDto,
  CreateQuestionDto,
  FavoriteDto,
  SearchDto,
} from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService, private moderation: ModerationService) {}

  getHomePage() {
    return {
      hero: 'رواية… ذاكرة التراث العربي',
      featuredSections: [
        'أحدث القصائد',
        'القصص المختارة',
        'شعراء بارزون',
        'الخيل',
        'الإبل',
        'الصقارة والقنص',
      ],
    };
  }

  listPoets(q?: string) {
    return this.prisma.poet.findMany({
      where: q ? { fullName: { contains: q, mode: 'insensitive' } } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  listPoems(q?: string) {
    return this.prisma.poem.findMany({
      where: {
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: { poet: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getPoem(id: string) {
    const poem = await this.prisma.poem.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        poet: true,
        versions: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          include: {
            verses: {
              orderBy: { orderIndex: 'asc' },
              include: { variants: true },
            },
          },
        },
        attributions: { include: { poet: { select: { id: true, fullName: true } } } },
      },
    }).catch(() => {
      throw new BadRequestException('القصيدة غير موجودة');
    });

    const comments = await this.prisma.comment.findMany({
      where: { contentType: 'POEM', contentId: id, isHidden: false, isDeleted: false },
      include: { user: { select: { profile: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return { ...poem, comments };
  }

  async createPoemVersion(poemId: string, dto: CreatePoemVersionDto, userId?: string) {
    const poem = await this.prisma.poem.findUnique({ where: { id: poemId } });
    if (!poem) throw new BadRequestException('القصيدة غير موجودة');

    const existingCount = await this.prisma.poemVersion.count({ where: { poemId } });

    return this.prisma.poemVersion.create({
      data: {
        poemId,
        label: dto.label,
        sourceNotes: dto.sourceNotes,
        isPrimary: existingCount === 0,
        createdBy: userId,
      },
    });
  }

  listPoemVersions(poemId: string) {
    return this.prisma.poemVersion.findMany({
      where: { poemId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      include: { verses: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  async createPoemVerse(versionId: string, dto: CreatePoemVerseDto, userId?: string) {
    const version = await this.prisma.poemVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new BadRequestException('نسخة القصيدة غير موجودة');

    return this.prisma.poemVerse.create({
      data: {
        versionId,
        text: dto.text,
        orderIndex: dto.orderIndex,
        explanation: dto.explanation,
        occasion: dto.occasion,
        difficultyWords: dto.difficultyWords as Prisma.InputJsonValue,
      },
    });
  }

  async createPoemVerseVariant(verseId: string, dto: CreatePoemVerseVariantDto, userId?: string) {
    const verse = await this.prisma.poemVerse.findUnique({ where: { id: verseId } });
    if (!verse) throw new BadRequestException('البيت غير موجود');

    return this.prisma.poemVerseVariant.create({
      data: {
        verseId,
        text: dto.text,
        sourceNotes: dto.sourceNotes,
        createdBy: userId,
      },
    });
  }

  async createPoemAttribution(poemId: string, dto: CreatePoemAttributionDto, userId?: string) {
    const poem = await this.prisma.poem.findUnique({ where: { id: poemId } });
    if (!poem) throw new BadRequestException('القصيدة غير موجودة');
    if (!dto.poetId && !dto.claimedName) {
      throw new BadRequestException('يجب تحديد شاعر مسجل أو اسم مُدَّعى على الأقل');
    }

    return this.prisma.poemAttribution.create({
      data: {
        poemId,
        poetId: dto.poetId,
        claimedName: dto.claimedName,
        consensus: dto.consensus ?? 'AGREED',
        notes: dto.notes,
        createdBy: userId,
      },
    });
  }

  listStories(q?: string) {
    return this.prisma.story.findMany({
      where: {
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
        status: 'PUBLISHED',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  listBooks(q?: string) {
    return this.prisma.book.findMany({
      where: {
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
        status: 'PUBLISHED',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  listHorses(q?: string) {
    return this.prisma.horse.findMany({
      where: {
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        status: 'PUBLISHED',
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  createPoem(dto: CreatePoemDto, createdBy?: string) {
    return this.prisma.poem.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        summary: dto.summary,
        body: dto.body,
        poetId: dto.poetId,
        createdBy,
        status: 'DRAFT',
      },
    });
  }

  // القصيدة نوع محتوى ضمن ModerationService العامة — هذه دوال توافقية رفيعة
  // تُبقي مسارات /poems/:id/submit|review|publish القديمة تعمل دون تغيير سلوكها من طرف لوحة الإدارة.
  submitPoem(id: string) {
    return this.moderation.submit('POEM', id);
  }

  async moderatePoem(id: string, action: 'approve' | 'request_revision' | 'reject', reviewerId: string, note?: string) {
    const { record, revisionId } = await this.moderation.review('POEM', id, reviewerId, action, note);
    return { poem: record, revisionId, action };
  }

  publishPoem(id: string, editorId: string, note?: string) {
    return this.moderation.publish('POEM', id, editorId, note);
  }

  listPendingPoems() {
    return this.prisma.poem.findMany({
      where: { status: { in: ['SUBMITTED', 'NEEDS_REVISION'] } },
      include: { poet: { select: { fullName: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  listAllPoems() {
    return this.prisma.poem.findMany({
      include: { poet: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  getModerationQueue() {
    return this.prisma.moderationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  createComment(userId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        contentType: dto.contentType as any,
        contentId: dto.contentId,
        userId,
        body: dto.body,
      },
    });
  }

  async addFavorite(userId: string, dto: FavoriteDto) {
    const existed = await this.prisma.favorite.findFirst({
      where: { userId, contentType: dto.contentType as any, contentId: dto.contentId },
    });
    if (existed) {
      await this.prisma.favorite.delete({ where: { id: existed.id } });
      return { removed: true };
    }

    return this.prisma.favorite.create({
      data: { userId, contentType: dto.contentType as any, contentId: dto.contentId },
    });
  }

  createQuestion(userId: string, dto: CreateQuestionDto) {
    return this.prisma.question.create({ data: { ...dto, createdBy: userId } });
  }

  listQuestions() {
    return this.prisma.question.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        createdAt: true,
      },
    });
  }

  questionDetails(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: {
        answers: {
          include: { author: { select: { profile: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // isOfficial لا يُقرأ أبدًا من مدخلات المستخدم — يُحسب هنا من صلاحياته
  // الفعلية في قاعدة البيانات فقط، وإلا لاستطاع أي مستخدم انتحال صفة إجابة
  // رسمية من المالك بمجرد إرسال isOfficial:true في الطلب.
  async answerQuestion(questionId: string, userId: string, body: string) {
    const isOfficial = await this.userHasPermission(userId, 'questions:answer_official');

    return this.prisma.answer.create({
      data: {
        questionId,
        userId,
        body,
        isOfficial,
        isPreferred: isOfficial,
      },
    });
  }

  private async userHasPermission(userId: string, code: string): Promise<boolean> {
    const count = await this.prisma.rolePermission.count({
      where: {
        permission: { code },
        role: { userRoles: { some: { userId } } },
      },
    });
    return count > 0;
  }

  reportContent(userId: string, body: { contentType: string; contentId: string; reason: string; details?: string }) {
    return this.prisma.contentReport.create({
      data: {
        contentType: body.contentType as any,
        contentId: body.contentId,
        reporterId: userId,
        reason: body.reason,
        details: body.details,
      },
    });
  }

  async search(qs: SearchDto) {
    const query = (qs.query || '').trim();
    const normalized = normalizeArabic(query);
    const filter: Prisma.StringFilter = { contains: normalized, mode: 'insensitive' };

    const basePoem: Prisma.PoemWhereInput = { status: 'PUBLISHED', deletedAt: null };
    const baseStory: Prisma.StoryWhereInput = { status: 'PUBLISHED', deletedAt: null };
    const baseBook: Prisma.BookWhereInput = { status: 'PUBLISHED' };

    const wherePoem: Prisma.PoemWhereInput = query ? { ...basePoem, OR: [{ title: filter }, { summary: filter }, { body: filter }] } : basePoem;
    const whereStory: Prisma.StoryWhereInput = query ? { ...baseStory, OR: [{ title: filter }, { summary: filter }, { body: filter }] } : baseStory;
    const whereBook: Prisma.BookWhereInput = query ? { ...baseBook, OR: [{ title: filter }, { summary: filter }, { body: filter }] } : baseBook;

    const [poems, stories, books] = await Promise.all([
      this.prisma.poem.findMany({ where: wherePoem, take: 20, orderBy: { createdAt: 'desc' } }),
      this.prisma.story.findMany({ where: whereStory, take: 20, orderBy: { createdAt: 'desc' } }),
      this.prisma.book.findMany({ where: whereBook, take: 20, orderBy: { createdAt: 'desc' } }),
    ]);

    await this.prisma.searchLog.create({
      data: { queryText: query, source: 'KEYWORD', resultCount: poems.length + stories.length + books.length },
    });

    return { poems, stories, books };
  }

  sectionsConfig() {
    return [
      { key: 'poetry', title: 'الشعر', route: '/poetry' },
      { key: 'stories', title: 'القصص', route: '/stories' },
      { key: 'books', title: 'الكتب', route: '/books' },
      { key: 'horses', title: 'الخيل', route: '/horses' },
      { key: 'camels', title: 'الإبل', route: '/camels' },
      { key: 'falcons', title: 'الصقارة', route: '/hunting' },
      { key: 'dogs', title: 'كلاب الصيد', route: '/hunting-dogs' },
    ];
  }
}
