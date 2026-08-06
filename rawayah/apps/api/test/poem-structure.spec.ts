import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContentService } from '../src/modules/content/content.service';
import { ModerationService } from '../src/modules/moderation/moderation.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';

describe('ContentService — نموذج القصيدة البنيوي (نسخ/أبيات/اختلاف روايات/نسبة)', () => {
  let service: ContentService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      poem: { findUnique: jest.fn() },
      poemVersion: { count: jest.fn(), create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
      poemVerse: { create: jest.fn(), findUnique: jest.fn() },
      poemVerseVariant: { create: jest.fn() },
      poemAttribution: { create: jest.fn() },
      rolePermission: { count: jest.fn() },
      answer: { create: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModerationService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(ContentService);
  });

  describe('createPoemVersion', () => {
    it('يرفض إنشاء نسخة لقصيدة غير موجودة', async () => {
      prisma.poem.findUnique.mockResolvedValue(null);
      await expect(service.createPoemVersion('missing', { label: 'رواية' })).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.poemVersion.create).not.toHaveBeenCalled();
    });

    it('أول نسخة للقصيدة تُصبح تلقائيًا هي النسخة الأساسية (isPrimary)', async () => {
      prisma.poem.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.poemVersion.count.mockResolvedValue(0);
      prisma.poemVersion.create.mockResolvedValue({ id: 'v1', isPrimary: true });

      await service.createPoemVersion('p1', { label: 'الرواية المتداولة' }, 'owner-1');

      expect(prisma.poemVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ poemId: 'p1', label: 'الرواية المتداولة', isPrimary: true, createdBy: 'owner-1' }),
      });
    });

    it('النسخة الثانية وما بعدها ليست أساسية تلقائيًا', async () => {
      prisma.poem.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.poemVersion.count.mockResolvedValue(1);
      prisma.poemVersion.create.mockResolvedValue({ id: 'v2', isPrimary: false });

      await service.createPoemVersion('p1', { label: 'رواية أخرى' }, 'owner-1');

      expect(prisma.poemVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isPrimary: false }),
      });
    });
  });

  describe('createPoemVerse', () => {
    it('يرفض إضافة بيت لنسخة قصيدة غير موجودة', async () => {
      prisma.poemVersion.findUnique.mockResolvedValue(null);
      await expect(
        service.createPoemVerse('missing-version', { text: 'صدر البيت', orderIndex: 1 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.poemVerse.create).not.toHaveBeenCalled();
    });

    it('ينشئ بيتًا مربوطًا بالنسخة الصحيحة', async () => {
      prisma.poemVersion.findUnique.mockResolvedValue({ id: 'v1' });
      prisma.poemVerse.create.mockResolvedValue({ id: 'verse1' });

      await service.createPoemVerse('v1', { text: 'يا دار عبلة', orderIndex: 1, explanation: 'شرح' });

      expect(prisma.poemVerse.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ versionId: 'v1', text: 'يا دار عبلة', orderIndex: 1, explanation: 'شرح' }),
      });
    });
  });

  describe('createPoemVerseVariant', () => {
    it('يرفض إضافة رواية بديلة لبيت غير موجود', async () => {
      prisma.poemVerse.findUnique.mockResolvedValue(null);
      await expect(
        service.createPoemVerseVariant('missing-verse', { text: 'نص مختلف' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.poemVerseVariant.create).not.toHaveBeenCalled();
    });

    it('ينشئ رواية بديلة مربوطة بالبيت الصحيح', async () => {
      prisma.poemVerse.findUnique.mockResolvedValue({ id: 'verse1' });
      prisma.poemVerseVariant.create.mockResolvedValue({ id: 'variant1' });

      await service.createPoemVerseVariant('verse1', { text: 'نص في رواية أخرى' }, 'owner-1');

      expect(prisma.poemVerseVariant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ verseId: 'verse1', text: 'نص في رواية أخرى', createdBy: 'owner-1' }),
      });
    });
  });

  describe('createPoemAttribution', () => {
    it('يرفض إنشاء نسبة لقصيدة غير موجودة', async () => {
      prisma.poem.findUnique.mockResolvedValue(null);
      await expect(service.createPoemAttribution('missing', { poetId: 'poet-1' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('يرفض إنشاء نسبة بلا شاعر مسجل ولا اسم مُدَّعى', async () => {
      prisma.poem.findUnique.mockResolvedValue({ id: 'p1' });
      await expect(service.createPoemAttribution('p1', {})).rejects.toThrow('يجب تحديد شاعر مسجل أو اسم مُدَّعى');
      expect(prisma.poemAttribution.create).not.toHaveBeenCalled();
    });

    it('ينشئ نسبة بحالة توافق DISPUTED عند تحديدها صراحة', async () => {
      prisma.poem.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.poemAttribution.create.mockResolvedValue({ id: 'attr1' });

      await service.createPoemAttribution('p1', { claimedName: 'شاعر غير مسجل', consensus: 'DISPUTED' }, 'owner-1');

      expect(prisma.poemAttribution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ poemId: 'p1', claimedName: 'شاعر غير مسجل', consensus: 'DISPUTED' }),
      });
    });
  });
});

describe('ContentService.answerQuestion — منع انتحال صفة إجابة رسمية (ثغرة isOfficial)', () => {
  let service: ContentService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      answer: { create: jest.fn() },
      rolePermission: { count: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModerationService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(ContentService);
  });

  it('لا تصبح الإجابة رسمية إن لم يملك المستخدم صلاحية questions:answer_official', async () => {
    prisma.rolePermission.count.mockResolvedValue(0);
    prisma.answer.create.mockResolvedValue({ id: 'a1' });

    await service.answerQuestion('q1', 'user-1', 'إجابة عادية');

    expect(prisma.answer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isOfficial: false, isPreferred: false }),
    });
  });

  it('تصبح الإجابة رسمية فقط إذا امتلك المستخدم الصلاحية فعليًا في قاعدة البيانات', async () => {
    prisma.rolePermission.count.mockResolvedValue(1);
    prisma.answer.create.mockResolvedValue({ id: 'a2' });

    await service.answerQuestion('q1', 'owner-1', 'إجابة رسمية');

    expect(prisma.rolePermission.count).toHaveBeenCalledWith({
      where: { permission: { code: 'questions:answer_official' }, role: { userRoles: { some: { userId: 'owner-1' } } } },
    });
    expect(prisma.answer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isOfficial: true, isPreferred: true }),
    });
  });

  it('لا يوجد أي مسار برمجي يقبل isOfficial كمدخل من المستخدم (فحص توقيع الدالة)', () => {
    expect(service.answerQuestion.length).toBe(3);
  });
});
