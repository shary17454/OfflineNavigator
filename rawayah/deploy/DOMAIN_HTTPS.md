# الدومين وHTTPS — دليل تنفيذي كامل

## الخطوة 1 — شراء الدومين
1. اختر مسجّلًا: **Namecheap** أو **GoDaddy** (كلاهما يقبل بطاقات خليجية عادة). Namecheap عادة أرخص وواجهته أبسط.
2. ابحث عن الاسم (مثلًا `mawrooth.com` أو `mawrooth.sa` إن أردت نطاق سعودي عبر SaudiNIC — يتطلب هوية وطنية للتسجيل)
3. أكمل الشراء (~$10-15/سنة لـ `.com`، رسوم مختلفة لـ `.sa`)

## الخطوة 2 — ربط الدومين بالاستضافة

### لو اخترت Railway أو Render
1. في لوحة الخدمة (api/web/admin) → **Settings → Custom Domain → Add Domain**
2. أدخل `your-domain.com` (للموقع)، `api.your-domain.com` (للـAPI)، `admin.your-domain.com` (للوحة)
3. المنصة تعطيك سجل DNS مطلوب (عادة **CNAME**)
4. ارجع للوحة تحكم الدومين (Namecheap/GoDaddy) → **DNS Settings** → أضف السجلات المعطاة بالضبط:
   ```
   Type: CNAME   Host: @ (أو www)   Value: <القيمة من Railway/Render>
   Type: CNAME   Host: api          Value: <القيمة من Railway/Render>
   Type: CNAME   Host: admin        Value: <القيمة من Railway/Render>
   ```
5. الانتشار يأخذ من 10 دقائق إلى 24 ساعة. تحقق بـ: https://dnschecker.org
6. **HTTPS تلقائي بالكامل** — Railway وRender يصدران شهادة Let's Encrypt بمجرد التحقق من DNS، بدون أي إعداد إضافي منك.

### لو اخترت VPS
اتبع الخطوة 7 في `VPS_DEPLOY.md` — تضيف سجلات **A** (لا CNAME) تشير لعنوان IP السيرفر مباشرة:
```
Type: A   Host: @      Value: <IP السيرفر>
Type: A   Host: api    Value: <IP السيرفر>
Type: A   Host: admin  Value: <IP السيرفر>
```
ثم `certbot --nginx` يصدر الشهادة بعد تأكد DNS.

## الخطوة 3 — تحديث متغيرات البيئة بالدومين الفعلي
بعد ربط الدومين، ارجع لكل خدمة وحدّث:
```
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_SITE_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://admin.your-domain.com
```
وأعد نشر (redeploy) الخدمات الثلاث حتى تلتقط القيم الجديدة.

## الخطوة 4 — تحديث بناء التطبيق الجوال
عند بناء الإصدار النهائي للـ App Store، استخدم الدومين الفعلي لا `localhost`:
```bash
flutter build ipa --release --dart-define=API_BASE_URL=https://api.your-domain.com/api
```

## قائمة تحقق نهائية
- [ ] `https://your-domain.com` يفتح الموقع بقفل أخضر (HTTPS صالح)
- [ ] `https://api.your-domain.com/api/docs` يفتح توثيق Swagger
- [ ] `https://admin.your-domain.com` يفتح لوحة الدخول
- [ ] `https://your-domain.com/sitemap.xml` يحتوي عناوين بدومينك الفعلي لا `localhost`
