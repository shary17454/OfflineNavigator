import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContentService } from '../src/modules/content/content.service';
import { ModerationService } from '../src/modules/moderation/moderation.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';

// نقاط قراءة عامة لموضوعات الخيل/الإبل/الصقارة والقنص/كلاب الصيد — أُضيفت
// لتغذية شاشات تطبيق الجوال المقابلة (كانت النماذج موجودة، القوائم فقط
// كانت مكشوفة، بلا تفاصيل فردية).
describe('ContentService — قراءات الخيل/الإبل/الصقارة/كلاب الصيد', () => {
  let service: ContentService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      horse: { findFirst: jest.fn() },
      camel: { findFirst: jest.fn() },
      falcon: { findFirst: jest.fn() },
      huntingDogBreed: { findUnique: jest.fn(), findMany: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [ContentService, { provide: PrismaService, useValue: prisma }, { provide: ModerationService, useValue: {} }],
    }).compile();
    service = moduleRef.get(ContentService);
  });

  it('getHorse يرفض حصانًا غير منشور برسالة عربية واضحة', async () => {
    prisma.horse.findFirst.mockResolvedValue(null);
    await expect(service.getHorse('missing')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getCamel يفلتر بحالة PUBLISHED فقط', async () => {
    prisma.camel.findFirst.mockResolvedValue({ id: 'c1' });
    await service.getCamel('c1');
    expect(prisma.camel.findFirst).toHaveBeenCalledWith({ where: { id: 'c1', status: 'PUBLISHED' } });
  });

  it('listHuntingDogBreeds لا يُصفّي بحالة نشر لأن السلالات بيانات مرجعية ثابتة بلا دورة مراجعة', async () => {
    prisma.huntingDogBreed.findMany.mockResolvedValue([]);
    await service.listHuntingDogBreeds();
    expect(prisma.huntingDogBreed.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
  });

  it('getHuntingDogBreed يرمي خطأً واضحًا لسلالة غير موجودة', async () => {
    prisma.huntingDogBreed.findUnique.mockResolvedValue(null);
    await expect(service.getHuntingDogBreed('missing')).rejects.toThrow('السلالة غير موجودة');
  });
});
