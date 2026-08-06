import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SourcesService } from '../src/modules/sources/sources.service';
import { RightsService } from '../src/modules/rights/rights.service';
import { SettingsService } from '../src/modules/settings/settings.service';
import { UpsertSettingDto } from '../src/modules/settings/dto/settings.dto';
import { PrismaService } from '../src/shared/prisma/prisma.service';

describe('SourcesService — إدارة مصادر الاستشهاد (قسم 15)', () => {
  let service: SourcesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = { source: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [SourcesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(SourcesService);
  });

  it('يرفض تعديل مصدر غير موجود', async () => {
    prisma.source.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { title: 'جديد' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.source.update).not.toHaveBeenCalled();
  });

  it('ينشئ مصدرًا جديدًا بمستوى الثقة المحدد', async () => {
    prisma.source.create.mockResolvedValue({ id: 's1', tier: 2 });
    await service.create({ title: 'مصدر', sourceType: 'ديوان', tier: 2 });
    expect(prisma.source.create).toHaveBeenCalledWith({ data: expect.objectContaining({ tier: 2 }) });
  });

  it('يُعطّل مصدرًا موجودًا (isActive: false) دون حذفه', async () => {
    prisma.source.findUnique.mockResolvedValue({ id: 's1' });
    prisma.source.update.mockResolvedValue({ id: 's1', isActive: false });
    await service.setActive('s1', false);
    expect(prisma.source.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { isActive: false } });
  });
});

describe('RightsService — سجلات حقوق النشر (قسم 21)', () => {
  let service: RightsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = { rightsRecord: { findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [RightsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(RightsService);
  });

  it('ينشئ سجل حقوق باستخدام المفتاح المركّب (contentType+contentId) عند عدم وجوده', async () => {
    prisma.rightsRecord.upsert.mockResolvedValue({ status: 'PUBLIC_DOMAIN' });
    await service.upsert('POEM', 'p1', { status: 'PUBLIC_DOMAIN' }, 'owner-1');
    expect(prisma.rightsRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contentType_contentId: { contentType: 'POEM', contentId: 'p1' } },
        create: expect.objectContaining({ contentType: 'POEM', contentId: 'p1', status: 'PUBLIC_DOMAIN', recordedById: 'owner-1' }),
      }),
    );
  });

  it('يحوّل تواريخ الاعتماد والانتهاء النصية إلى كائنات Date فعلية', async () => {
    prisma.rightsRecord.upsert.mockResolvedValue({});
    await service.upsert('BOOK', 'b1', { status: 'LICENSED', grantedAt: '2026-01-01T00:00:00.000Z' }, 'owner-1');
    const call = prisma.rightsRecord.upsert.mock.calls[0][0];
    expect(call.create.grantedAt).toBeInstanceOf(Date);
  });
});

describe('SettingsService — إعدادات النظام (مفتاح/قيمة)', () => {
  let service: SettingsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = { appSetting: { findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [SettingsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(SettingsService);
  });

  it('يستخدم النطاق العام (global) افتراضيًا عند عدم تحديده', async () => {
    prisma.appSetting.upsert.mockResolvedValue({});
    await service.upsert({ key: 'site.title', value: 'موروث' });
    expect(prisma.appSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { key: 'site.title', value: 'موروث', scope: 'global' },
      }),
    );
  });

  it('يحترم النطاق المُحدَّد صراحة', async () => {
    prisma.appSetting.upsert.mockResolvedValue({});
    await service.upsert({ key: 'ingestion.rate_limit', value: 5, scope: 'ingestion' });
    const call = prisma.appSetting.upsert.mock.calls[0][0];
    expect(call.create.scope).toBe('ingestion');
  });
});

describe('UpsertSettingDto عبر ValidationPipe الفعلي — ثغرة اكتُشفت حيًّا', () => {
  // بخيار whitelist:true العام (main.ts) يحذف NestJS أي حقل بلا مُزخرِف
  // class-validator واحد على الأقل حتى لو أُرسل فعليًا — هذا بالضبط ما كان
  // يجعل POST /settings يفشل بـ500 "Argument value is missing" رغم أن
  // العميل يرسله بوضوح. لا يمكن لاختبار بـPrisma مموَّه اكتشاف هذا لأنه
  // خلل في طبقة الـPipe قبل وصول الطلب للخدمة إطلاقًا.
  it('يُبقي حقل value في الجسم رغم whitelist:true بفضل IsDefined', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const result = await pipe.transform(
      { key: 'site.title', value: 'موروث', scope: 'global' },
      { type: 'body', metatype: UpsertSettingDto },
    );
    expect(result.value).toBe('موروث');
  });

  it('يقبل value=false (منطقي) ولا يحذفه رغم أنه Falsy', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const result = await pipe.transform(
      { key: 'site.maintenance_mode', value: false },
      { type: 'body', metatype: UpsertSettingDto },
    );
    expect(result.value).toBe(false);
  });
});
