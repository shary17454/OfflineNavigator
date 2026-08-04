import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  normalize(text: string) {
    return text
      .replace(/[إأآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه')
      .trim();
  }

  async suggest(query: string, type = 'general') {
    const norm = this.normalize(query);

    const where = norm
      ? {
          OR: [
            { title: { contains: norm, mode: 'insensitive' } },
            { summary: { contains: norm, mode: 'insensitive' } },
          ],
        }
      : {};

    const items = await this.prisma.poem.findMany({
      where: { ...where, status: 'PUBLISHED', deletedAt: null },
      select: { title: true, slug: true },
      take: 5,
    });

    const tags = await this.prisma.searchLog.findMany({ where: { queryText: { contains: norm } }, orderBy: { createdAt: 'desc' }, take: 5, select: { queryText: true } });

    const recent = tags
      .map((t: { queryText: string }) => t.queryText)
      .filter((t: string): t is string => Boolean(t));

    const titles = items.map((item: { title: string }) => item.title);
    const suggestions = Array.from(new Set<string>([...titles, ...recent])).slice(0, 10);

    return {
      query: norm,
      type,
      suggestions: suggestions.slice(0, 10),
    };
  }
}
