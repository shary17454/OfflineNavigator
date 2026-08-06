import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // نظرة عامة: أرقام حقيقية من قاعدة البيانات فقط — لا مؤشرات وهمية ولا
  // تقديرات. لا يوجد جدول أحداث تحليلية عام (AnalyticsEvent) بعد لأن بناءه
  // دون خط أنابيب فعلي لتغذيته سيُنشئ جدولاً فارغًا بلا فائدة (مخالف لقاعدة
  // "لا تنشئ جداول فارغة بلا حاجة") — التحليلات هنا مبنية على البيانات
  // الحقيقية الموجودة فعليًا: سجلات البحث وعدادات المشاهدة والعد المباشر.
  async overview() {
    const [
      totalUsers,
      totalPoems,
      publishedPoems,
      pendingReview,
      totalStories,
      publishedStories,
      totalIngestionJobs,
      totalSearches,
      zeroResultSearches,
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.poem.count(),
      this.prisma.poem.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.poem.count({ where: { status: { in: ['SUBMITTED', 'NEEDS_REVISION'] } } }),
      this.prisma.story.count(),
      this.prisma.story.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.ingestionJob.count(),
      this.prisma.searchLog.count(),
      this.prisma.searchLog.count({ where: { resultCount: 0 } }),
    ]);

    return {
      totalUsers,
      content: { totalPoems, publishedPoems, pendingReview, totalStories, publishedStories },
      ingestionJobs: totalIngestionJobs,
      search: {
        totalSearches,
        zeroResultSearches,
        zeroResultRate: totalSearches > 0 ? Number((zeroResultSearches / totalSearches).toFixed(3)) : 0,
      },
    };
  }

  async topSearchQueries(limit = 20) {
    const grouped = await this.prisma.searchLog.groupBy({
      by: ['queryText'],
      _count: { queryText: true },
      orderBy: { _count: { queryText: 'desc' } },
      take: limit,
      where: { queryText: { not: '' } },
    });
    return grouped.map((g) => ({ query: g.queryText, count: g._count.queryText }));
  }

  async zeroResultQueries(limit = 20) {
    return this.prisma.searchLog.findMany({
      where: { resultCount: 0, queryText: { not: '' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { queryText: true, createdAt: true },
    });
  }

  async mostViewedPoems(limit = 10) {
    return this.prisma.poem.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { viewCount: 'desc' },
      take: limit,
      select: { id: true, title: true, viewCount: true },
    });
  }

  async newUsersPerDay(days = 14) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    return this.bucketByDay(users.map((u) => u.createdAt));
  }

  private bucketByDay(dates: Date[]) {
    const buckets = new Map<string, number>();
    for (const d of dates) {
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
}
