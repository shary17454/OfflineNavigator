# نشر موروث على Render — دليل تنفيذي كامل

بديل لـ Railway، نفس السهولة تقريبًا، يختلف بترتيب الخدمات وواجهة الإعداد.

## الخطوة 1 — الحساب
1. https://render.com → **Get Started** → **GitHub** (اربط المستودع)
2. أضف بطاقة الدفع من **Account Settings → Billing** (مطلوبة للخدمات المدفوعة، الخطة المجانية للاختبار فقط ولا تناسب الإنتاج لأنها تُغلق الخدمة بعد عدم الاستخدام)

## الخطوة 2 — قاعدة البيانات
1. **New → PostgreSQL**
2. الاسم: `rawaya-db`، المنطقة: الأقرب لمستخدميك (مثلًا Frankfurt لو الجمهور خليجي/عربي)
3. بعد الإنشاء، انسخ **Internal Database URL** (يبدأ بـ `postgres://`)

## الخطوة 3 — Redis
1. **New → Redis**
2. انسخ **Internal Redis URL**

## الخطوة 4 — تخزين الوسائط
نفس خطوة Railway: Cloudflare R2 (مجاني، متوافق S3). أنشئ Bucket واحصل على Access Key/Secret Key.

## الخطوة 5 — خادم API
1. **New → Web Service** → اختر المستودع
2. **Root Directory**: `apps/api`
3. **Runtime**: Docker (Render يقرأ `apps/api/Dockerfile` تلقائيًا)
4. **Environment Variables**:
```
DATABASE_URL=<من الخطوة 2>
REDIS_URL=<من الخطوة 3>
JWT_SECRET=<openssl rand -base64 32>
JWT_REFRESH_SECRET=<openssl rand -base64 32>
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<من R2>
S3_SECRET_KEY=<من R2>
S3_BUCKET=rawaya-media
S3_REGION=auto
ALLOWED_ORIGINS=https://your-domain.com,https://admin.your-domain.com
PORT=4000
```
5. **Health Check Path**: `/api/docs` (يؤكد لـ Render أن الخدمة حيّة)
6. اضغط **Create Web Service** — يبني وينشر، ويعطيك رابطًا مثل `rawaya-api.onrender.com`

## الخطوة 6 — تهيئة قاعدة البيانات (مرة واحدة)
من تبويب الخدمة → **Shell** (Render يوفر طرفية داخل حاوية الخدمة مباشرة):
```bash
npx prisma migrate deploy
npm run seed
npm run create-owner
```

## الخطوة 7 — الموقع ولوحة المالك
كرر **New → Web Service** لكل من:
- `apps/web` (Root Directory) — env: `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL`, `NEXT_PUBLIC_SITE_URL`, `PORT=3001`
- `apps/admin` (Root Directory) — env: `NEXT_PUBLIC_API_URL`, `PORT=3002`

## ملاحظة مهمة عن الخطة المجانية
خدمات Render المجانية "تنام" بعد 15 دقيقة خمول وتحتاج ~30 ثانية لإعادة التشغيل عند أول طلب — **غير مقبول لتطبيق منشور فعليًا على المستخدمين**. استخدم خطة **Starter ($7/شهر لكل خدمة)** كحد أدنى للإنتاج.

## التكلفة المتوقعة
- Postgres (Starter): ~$7/شهر
- Redis: ~$10/شهر (أو استخدم Upstash المجاني كبديل خارجي)
- 3 خدمات ويب (Starter): $21/شهر
- **المجموع: ~$38/شهر** — أغلى من Railway لكن أكثر ثباتًا في السعر
