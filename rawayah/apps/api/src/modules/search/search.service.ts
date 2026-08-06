import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { normalizeArabic } from '../../shared/common/arabic-normalize';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  normalize(text: string) {
    return normalizeArabic(text);
  }

  // اقتراحات إكمال تلقائي سريعة أثناء الكتابة — تبحث عبر عدة أنواع محتوى منشورة فقط.
  async suggest(query: string, type = 'general') {
    const norm = this.normalize(query);
    const filter = norm ? { contains: norm, mode: 'insensitive' as const } : undefined;

    const [poems, stories, books, poets, recentLogs] = await Promise.all([
      this.prisma.poem.findMany({
        where: { status: 'PUBLISHED', deletedAt: null, ...(filter ? { title: filter } : {}) },
        select: { title: true, slug: true },
        take: 5,
      }),
      this.prisma.story.findMany({
        where: { status: 'PUBLISHED', deletedAt: null, ...(filter ? { title: filter } : {}) },
        select: { title: true, slug: true },
        take: 5,
      }),
      this.prisma.book.findMany({
        where: { status: 'PUBLISHED', ...(filter ? { title: filter } : {}) },
        select: { title: true, slug: true },
        take: 5,
      }),
      this.prisma.poet.findMany({
        where: { status: 'PUBLISHED', deletedAt: null, ...(filter ? { fullName: filter } : {}) },
        select: { fullName: true, slug: true },
        take: 5,
      }),
      this.prisma.searchLog.findMany({
        where: norm ? { queryText: { contains: norm } } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { queryText: true },
      }),
    ]);

    const titles = [
      ...poems.map((p) => p.title),
      ...stories.map((s) => s.title),
      ...books.map((b) => b.title),
      ...poets.map((p) => p.fullName),
    ];
    const recent = recentLogs.map((l) => l.queryText).filter(Boolean);

    const suggestions = Array.from(new Set([...titles, ...recent])).slice(0, 10);

    return { query: norm, type, suggestions };
  }
}
