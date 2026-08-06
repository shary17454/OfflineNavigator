import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ModerationService } from '../src/modules/moderation/moderation.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';

describe('ModerationService — منع النشر بلا مصدر أو حقوق (سيناريوهات 9، 10، 13)', () => {
  let service: ModerationService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      poem: { findUnique: jest.fn(), update: jest.fn() },
      contentSource: { count: jest.fn() },
      passage: { count: jest.fn() },
      mediaFile: { count: jest.fn() },
      rightsRecord: { findUnique: jest.fn() },
      contentRevision: { create: jest.fn() },
      moderationLog: { create: jest.fn() },
      auditLog: { create: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ModerationService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ModerationService);
  });

  it('يرفض النشر إذا لم يكن العنصر بحالة VERIFIED أو SUBMITTED', async () => {
    prisma.poem.findUnique.mockResolvedValue({ id: 'p1', status: 'DRAFT' });
    await expect(service.publish('POEM', 'p1', 'owner-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('يرفض النشر عند عدم وجود أي مصدر موثق (سيناريو 9)', async () => {
    prisma.poem.findUnique.mockResolvedValue({ id: 'p1', status: 'VERIFIED' });
    prisma.contentSource.count.mockResolvedValue(0);
    prisma.passage.count.mockResolvedValue(0);

    await expect(service.publish('POEM', 'p1', 'owner-1')).rejects.toThrow('لا يمكن نشر محتوى بلا مصدر موثق');
    expect(prisma.poem.update).not.toHaveBeenCalled();
  });

  it('يرفض نشر محتوى مرتبط بوسائط حالة حقوقها غير معروفة (سيناريو 10)', async () => {
    prisma.poem.findUnique.mockResolvedValue({ id: 'p1', status: 'VERIFIED' });
    prisma.contentSource.count.mockResolvedValue(1);
    prisma.mediaFile.count.mockResolvedValue(1);
    prisma.rightsRecord.findUnique.mockResolvedValue({ status: 'UNKNOWN' });

    await expect(service.publish('POEM', 'p1', 'owner-1')).rejects.toThrow('حقوق واضحة ومسموحة');
    expect(prisma.poem.update).not.toHaveBeenCalled();
  });

  it('ينشر بنجاح عند توفر مصدر وحقوق واضحة (PUBLIC_DOMAIN)', async () => {
    prisma.poem.findUnique.mockResolvedValue({ id: 'p1', status: 'VERIFIED' });
    prisma.contentSource.count.mockResolvedValue(2);
    prisma.mediaFile.count.mockResolvedValue(1);
    prisma.rightsRecord.findUnique.mockResolvedValue({ status: 'PUBLIC_DOMAIN' });
    prisma.poem.update.mockResolvedValue({ id: 'p1', status: 'PUBLISHED' });

    const result = await service.publish('POEM', 'p1', 'owner-1');
    expect(result.status).toBe('PUBLISHED');
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('ينشر بنجاح بلا وسائط طالما يوجد مصدر نصي (لا تُطلب سجلات حقوق لمحتوى بلا وسائط)', async () => {
    prisma.poem.findUnique.mockResolvedValue({ id: 'p1', status: 'VERIFIED' });
    prisma.contentSource.count.mockResolvedValue(1);
    prisma.mediaFile.count.mockResolvedValue(0);
    prisma.poem.update.mockResolvedValue({ id: 'p1', status: 'PUBLISHED' });

    await expect(service.publish('POEM', 'p1', 'owner-1')).resolves.toMatchObject({ status: 'PUBLISHED' });
    expect(prisma.rightsRecord.findUnique).not.toHaveBeenCalled();
  });

  it('يرمي NotFoundException عند محاولة العمل على عنصر غير موجود', async () => {
    prisma.poem.findUnique.mockResolvedValue(null);
    await expect(service.submit('POEM', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('يرفض نوع محتوى لا يدعم سير المراجعة (مثل NARRATOR بلا حقل status)', async () => {
    await expect(service.submit('NARRATOR' as any, 'n1')).rejects.toThrow('لا يدعم سير المراجعة');
  });
});
