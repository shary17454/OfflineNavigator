import { Test } from '@nestjs/testing';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';

describe('AnalyticsService — تحليلات أساسية من بيانات حقيقية فقط (قسم 43)', () => {
  let service: AnalyticsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { count: jest.fn(), findMany: jest.fn() },
      poem: { count: jest.fn(), findMany: jest.fn() },
      story: { count: jest.fn() },
      ingestionJob: { count: jest.fn() },
      searchLog: { count: jest.fn(), groupBy: jest.fn(), findMany: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [AnalyticsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(AnalyticsService);
  });

  it('يحسب معدل البحث بلا نتائج بدقة من عددين حقيقيين', async () => {
    prisma.user.count.mockResolvedValue(10);
    prisma.poem.count.mockResolvedValue(20);
    prisma.story.count.mockResolvedValue(5);
    prisma.ingestionJob.count.mockResolvedValue(2);
    prisma.searchLog.count.mockResolvedValueOnce(100).mockResolvedValueOnce(25);

    const result = await service.overview();
    expect(result.search.totalSearches).toBe(100);
    expect(result.search.zeroResultSearches).toBe(25);
    expect(result.search.zeroResultRate).toBe(0.25);
  });

  it('لا يقسم على صفر عند عدم وجود أي عمليات بحث بعد', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.poem.count.mockResolvedValue(0);
    prisma.story.count.mockResolvedValue(0);
    prisma.ingestionJob.count.mockResolvedValue(0);
    prisma.searchLog.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const result = await service.overview();
    expect(result.search.zeroResultRate).toBe(0);
  });

  it('يستبعد استعلامات البحث الفارغة من أكثر الاستعلامات تكرارًا', async () => {
    prisma.searchLog.groupBy.mockResolvedValue([{ queryText: 'امرؤ القيس', _count: { queryText: 7 } }]);
    const result = await service.topSearchQueries();
    expect(prisma.searchLog.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { queryText: { not: '' } } }),
    );
    expect(result).toEqual([{ query: 'امرؤ القيس', count: 7 }]);
  });

  it('يجمّع المستخدمين الجدد في دلاء يومية بترتيب زمني صحيح', async () => {
    prisma.user.findMany.mockResolvedValue([
      { createdAt: new Date('2026-08-02T10:00:00Z') },
      { createdAt: new Date('2026-08-01T08:00:00Z') },
      { createdAt: new Date('2026-08-02T22:00:00Z') },
    ]);

    const result = await service.newUsersPerDay(14);
    expect(result).toEqual([
      { date: '2026-08-01', count: 1 },
      { date: '2026-08-02', count: 2 },
    ]);
  });
});
