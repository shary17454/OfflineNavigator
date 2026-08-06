import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateCommentDto, CreatePoemDto, CreateQuestionDto, FavoriteDto, SearchDto } from './dto/content.dto';

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
      include: { poet: true },
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

  answerQuestion(questionId: string, userId: string, body: string, isOfficial = false) {
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
    const normalized = query.replace(/[إأآ]/g, 'ا');
    const filter = { contains: normalized, mode: 'insensitive' } as any;

    const base = { status: 'PUBLISHED', deletedAt: null } as any;
    const wherePoem = query ? { ...base, OR: [{ title: filter }, { summary: filter }, { body: filter }] } : base;
    const whereStory = query ? { ...base, OR: [{ title: filter }, { summary: filter }, { body: filter }] } : base;
    const whereBook = query ? { ...base, OR: [{ title: filter }, { summary: filter }, { body: filter }] } : base;

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
