# نشر موروث على Railway — دليل تنفيذي كامل

هذا الدليل يفترض أنك تنفذه بنفسك (يحتاج حسابك وبطاقتك). كل خطوة فيها زر تضغطه بالضبط.

## لماذا Railway
أسهل خيار لإطلاق أول — لا تدير سيرفر، لا تُعدّ Nginx يدويًا، النشر تلقائي من GitHub، ودعم PostgreSQL/Redis كإضافات جاهزة بضغطة.

## الخطوة 1 — إنشاء الحساب
1. افتح https://railway.app
2. اضغط **Login** → **Login with GitHub** (يربط مباشرة بمستودعك `shary17454/OfflineNavigator`)
3. أضف بطاقة الدفع من **Account Settings → Billing** (Railway يحتاج بطاقة حتى مع الخطة المجانية التجريبية)

## الخطوة 2 — إنشاء المشروع وقاعدة البيانات
1. من لوحة Railway: **New Project**
2. اختر **Provision PostgreSQL** — ينشئ قاعدة بيانات فورًا ويعطيك `DATABASE_URL` تلقائيًا
3. من نفس المشروع: **+ New** → **Database** → **Add Redis**
4. لتخزين الوسائط (بديل MinIO): سجّل حساب مجاني في **Cloudflare R2** (متوافق مع S3، مجاني حتى 10GB) — https://dash.cloudflare.com → R2 → Create Bucket باسم `rawaya-media`، ثم **Manage API Tokens** لإنشاء Access Key/Secret Key

## الخطوة 3 — نشر خادم API
1. من نفس المشروع في Railway: **+ New** → **GitHub Repo** → اختر `OfflineNavigator`
2. **Settings → Root Directory**: اكتب `apps/api`
3. **Settings → Watch Paths**: `apps/api/**` (حتى لا يعيد النشر عند تعديل الموقع فقط)
4. من تبويب **Variables** أضف بالضبط:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<شغّل: openssl rand -base64 32>
JWT_REFRESH_SECRET=<شغّل: openssl rand -base64 32>
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<من Cloudflare R2>
S3_SECRET_KEY=<من Cloudflare R2>
S3_BUCKET=rawaya-media
S3_REGION=auto
ALLOWED_ORIGINS=https://your-domain.com,https://admin.your-domain.com
PORT=4000
```

القيمتان `${{Postgres.DATABASE_URL}}` و`${{Redis.REDIS_URL}}` مرجعان تلقائيان من Railway — لا تكتب رابطًا يدويًا، فقط اربط الخدمة من قائمة **Add Reference**.

5. **Settings → Networking → Generate Domain** — يعطيك رابطًا مؤقتًا مثل `rawaya-api.up.railway.app` (استخدمه للاختبار قبل ربط الدومين الخاص)
6. Railway يبني وينشر تلقائيًا. راقب **Deployments → View Logs**.

## الخطوة 4 — تهيئة قاعدة البيانات (مرة واحدة فقط)
من تبويب الخدمة → **Settings → Deploy → Custom Start Command** مؤقتًا أو عبر Railway CLI محليًا:

```bash
npm install -g @railway/cli
railway login
railway link   # اختر مشروعك
railway run --service api npx prisma migrate deploy
railway run --service api npm run seed        # فقط أول مرة، بيانات تجريبية
railway run --service api npm run create-owner # ينشئ حساب المالك الفعلي
```

## الخطوة 5 — نشر الموقع العام (web)
1. **+ New** → **GitHub Repo** → نفس المستودع
2. **Root Directory**: `apps/web`
3. **Variables**:
```
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
API_INTERNAL_URL=https://rawaya-api.up.railway.app/api
NEXT_PUBLIC_SITE_URL=https://your-domain.com
PORT=3001
```
(`API_INTERNAL_URL` يبقى برابط Railway الداخلي حتى بعد ربط الدومين — أسرع وأكثر أمانًا للطلبات من الخادم لنفسه)

## الخطوة 6 — نشر لوحة المالك (admin)
1. **+ New** → **GitHub Repo** → نفس المستودع
2. **Root Directory**: `apps/admin`
3. **Variables**:
```
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
PORT=3002
```
4. **مهم أمنيًا**: من **Settings → Networking**، لا تجعل هذا التطبيق عامًا بلا حماية إضافية — إمّا Railway's **Private Networking** + VPN، أو على الأقل قيّد الدخول بجدار حماية IP إن توفر، لأن لوحة المالك تتحكم بالحقوق والنشر.

## التكلفة المتوقعة
- Postgres + Redis + 3 خدمات (api/web/admin) بحركة زوار متوسطة: **$15-25/شهر**
- Cloudflare R2 للوسائط: مجاني حتى 10GB، ثم $0.015/GB
