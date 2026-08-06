import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';

// اختبار End-to-End حقيقي عبر خادم HTTP فعلي وقاعدة بيانات حقيقية — يُشغَّل فقط
// بتفعيل صريح عبر RUN_LIVE_E2E=1 (وليس بمجرد وجود DATABASE_URL، لأن Nest's
// ConfigModule.forRoot() في أي اختبار آخر يحمّل .env عبر dotenv ويُلوّث
// process.env على مستوى عملية Jest نفسها — وJest يعيد استخدام نفس العملية لعدة
// ملفات اختبار متتالية — فيصبح وجود DATABASE_URL غير حتمي وغير موثوق كشرط).
// شغّله عبر: npm run test:live (يتطلب Postgres حيًا محليًا).
//
// هذا الاختبار تحديدًا هو الذي كان سيكتشف خطأً حقيقيًا وُجد أثناء التحقق اليدوي:
// تسجيل PermissionGuard كحارس عام (APP_GUARD) في app.module.ts كان يجعله يُنفَّذ
// قبل JwtAuthGuard على مستوى المسار، فيرفض كل طلب محمي بصلاحية بخطأ "غير مسجل"
// حتى لو كان المستخدم مسجّلاً فعليًا بتوكن صالح. اختبارات الوحدة المموَّهة لا يمكن
// أن تكتشف هذا لأنها لا تُشغّل خط أنابيب الحُرّاس (Guards pipeline) الفعلي لـNest.
const runLiveE2e = process.env.RUN_LIVE_E2E === '1';
const describeIfLiveDb = runLiveE2e ? describe : describe.skip;

describeIfLiveDb('E2E — ترتيب تنفيذ الحُرّاس عبر خادم HTTP حقيقي', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testEmail = `e2e-guard-test-${Date.now()}@example.com`;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  it('يرفض إنشاء محتوى بلا أي توكن (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/poems')
      .send({ slug: `e2e-${Date.now()}`, title: 'اختبار', body: 'نص', poetId: 'nonexistent' })
      .expect(401);
  });

  it('يرفض إنشاء محتوى بمستخدم مسجَّل دخوله فعليًا لكن بلا صلاحية content:create (403 لا 401)', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: testEmail, displayName: 'اختبار الحُرّاس', password: 'P@ssw0rd123' })
      .expect(201);

    const token = register.body.accessToken;
    expect(typeof token).toBe('string');

    // هذا بالضبط السطر الذي كان يفشل بخطأ 401 "المستخدم غير مسجل" قبل الإصلاح،
    // رغم أن المستخدم مسجَّل دخوله فعليًا بتوكن صالح — والسبب أن الحارس العام
    // كان ينفَّذ قبل مصادقة JWT فيرى req.user فارغًا دائمًا.
    const res = await request(app.getHttpServer())
      .post('/api/poems')
      .set('Authorization', `Bearer ${token}`)
      .send({ slug: `e2e-${Date.now()}`, title: 'اختبار', body: 'نص', poetId: 'nonexistent' });

    expect(res.status).toBe(403);
    expect(res.status).not.toBe(401);
  });

  it('يسمح بالوصول لمسار عام بلا توكن إطلاقًا (لا يُحجب افتراضيًا)', async () => {
    await request(app.getHttpServer()).get('/api/home').expect(200);
  });
});
