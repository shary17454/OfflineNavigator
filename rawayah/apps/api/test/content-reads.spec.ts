import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContentService } from '../src/modules/content/content.service';
import { ModerationService } from '../src/modules/moderation/moderation.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';

// نقاط قراءة عامة أُضيفت لتغذية شاشات تطبيق الجوال الجديدة (شعراء/قصص/كتب/
// أمثال/مفردات/أماكن/موضوعات) — كانت غائبة تمامًا رغم وجود النماذج في
// قاعدة البيانات منذ مراحل سابقة، فلم يكن ممكنًا بناء شاشات حقيقية بلا
// اختلاق بيانات (ممنوع صراحة).
describe('ContentService — نقاط قراءة عامة جديدة لتطبيق الجوال', () => {
  let service: ContentService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      poet: { findFirst: jest.fn() },
      story: { findFirst: jest.fn() },
      book: { findFirst: jest.fn() },
      proverb: { findFirst: jest.fn(), findMany: jest.fn() },
      vocabularyTerm: { findFirst: jest.fn(), findMany: jest.fn() },
      place: { findFirst: jest.fn(), findMany: jest.fn() },
      topic: { findFirst: jest.fn(), findMany: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [ContentService, { provide: PrismaService, useValue: prisma }, { provide: ModerationService, useValue: {} }],
    }).compile();
    service = moduleRef.get(ContentService);
  });

  it('getPoet يرمي خطأً واضحًا لشاعر غير موجود أو غير منشور', async () => {
    prisma.poet.findFirst.mockResolvedValue(null);
    await expect(service.getPoet('missing')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getStory يفلتر بحالة PUBLISHED وdeletedAt:null فقط', async () => {
    prisma.story.findFirst.mockResolvedValue({ id: 's1', title: 'قصة' });
    await service.getStory('s1');
    expect(prisma.story.findFirst).toHaveBeenCalledWith({
      where: { id: 's1', status: 'PUBLISHED', deletedAt: null },
    });
  });

  it('getPlace يستبعد الأماكن الحساسة (isSensitive) من القراءة العامة', async () => {
    prisma.place.findFirst.mockResolvedValue(null);
    await expect(service.getPlace('p1')).rejects.toThrow('المكان غير موجود');
    expect(prisma.place.findFirst).toHaveBeenCalledWith({
      where: { id: 'p1', status: 'PUBLISHED', deletedAt: null, isSensitive: false },
    });
  });

  it('listPlaces يستبعد الأماكن الحساسة من نتائج القائمة أيضًا لا التفاصيل فقط', async () => {
    prisma.place.findMany.mockResolvedValue([]);
    await service.listPlaces();
    const call = prisma.place.findMany.mock.calls[0][0];
    expect(call.where.isSensitive).toBe(false);
  });

  it('listProverbs وgetProverb يتحققان من النشر قبل الإرجاع', async () => {
    prisma.proverb.findMany.mockResolvedValue([]);
    await service.listProverbs('مثل');
    expect(prisma.proverb.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'PUBLISHED' }) }),
    );

    prisma.proverb.findFirst.mockResolvedValue(null);
    await expect(service.getProverb('missing')).rejects.toBeInstanceOf(BadRequestException);
  });
});
