# حزمة النشر — موروث

## الحالة الفعلية (2026-08-08): منشور فعليًا على Railway

الخيار المُنفَّذ هو Railway. الخدمات الثلاث حيّة الآن:

| الخدمة | الرابط |
|---|---|
| API | https://rawaya-api-production.up.railway.app/api |
| الموقع العام | https://rawaya-web-production.up.railway.app |
| لوحة المالك | https://rawaya-admin-production.up.railway.app |

`RAILWAY_DEPLOY.md` يبقى مرجعًا لإعادة الإنتاج (بيئة ثانية، أو لو احتجت تفصيل خطوة سابقة)، لا خطوة معلّقة. `RENDER_DEPLOY.md` و`VPS_DEPLOY.md` بدائل غير مستخدمة حاليًا.

**الباقي فعليًا:**
1. `DOMAIN_HTTPS.md` — ربط دومين خاص بدل روابط `*.up.railway.app` المؤقتة
2. تخزين الوسائط (Cloudflare R2 أو مشابه) — غير مضبوط بعد
3. `APPLE_DEVELOPER.md` — النشر على App Store، لم يبدأ بعد

## ما الذي تغيّر في الكود لدعم هذا؟

**إصلاح CORS في `apps/api/src/main.ts`**: الخادم كان بلا CORS مفعّل إطلاقًا — لو الموقع العام (`your-domain.com`) استدعى الـAPI من دومين مختلف (`api.your-domain.com`)، كان المتصفح سيرفض كل الطلبات. الآن مضبوط عبر متغير بيئة جديد:

```
ALLOWED_ORIGINS=https://your-domain.com,https://admin.your-domain.com
```

غيابه = وضع تطوير محلي (كل الأصول مسموحة) — لا يكسر أي شيء محليًا، لكن **إلزامي وضعه في الإنتاج**.

## نقطة واحدة تحتاج قرارك قبل أي تنفيذ
أي استضافة من الثلاث؟ بمجرد ما تخبرني، أقدر:
- أشغّل أوامر Railway/Render CLI نيابة عنك لو أعطيتني بيانات الدخول أو صلاحية CLI محلية
- أو أمشي معك سطرًا بسطر لو تفضّل تنفذها بنفسك من طرفيتك
