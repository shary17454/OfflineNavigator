# Architecture: رواية

## الهيكل
- `apps/api`: API وطبقة النماذج + الخدمات.
- `apps/web`: واجهة المستخدم العامة.
- `apps/admin`: لوحة تحكم إدارية.
- `apps/mobile`: تطبيق Flutter (MVP).
- `packages/*`: موديولات مشتركة (الواجهات/الأنواع/الإعدادات/الأدوات).

## التوجيهات
- استخدام `apps/*` كـ clean architecture modules.
- الاعتماد على PostgreSQL وPrisma لتوحيد بيانات المحتوى.
- JWT قصيرة + refresh token، مع تسجيل refresh token في DB.
- RBAC عبر الدور + الصلاحية.

## قرارات تقنية
- تم استخدام Next.js مع صفحات بدائية (Pages Router) لتسريع بداية MVP.
- Flutter يستخدم `go_router` + `flutter_riverpod`.

## طبقة شبكة المعرفة (Knowledge Graph Layer)

أُضيفت إلى `schema.prisma` نماذج تأسيسية تجعل قاعدة البيانات قادرة على استيعاب
مواصفات "رواية التراث" الكاملة دون إعادة هيكلة لاحقًا، حتى لو لم تُبنَ كل
واجهة استخدام في هذه المرحلة:

| النموذج | يخدم الميزة |
|---|---|
| `EntityRelation` | شبكة المعرفة + مستكشف التراث + شبكة الأشخاص (علاقة نصية مفتوحة بين أي عنصرين) |
| `TrustAssessment` | بطاقة الثقة لكل عنصر محتوى (درجة، سبب، عدد مصادر، تعارض، مراجع، تاريخ مراجعة) |
| `Passage` + `PassageSource` | التوثيق على مستوى الفقرة/البيت/الادعاء |
| `SourceLineage` | شجرة المصادر (سلسلة النقل بين المصادر) |
| `Narration` | مقارنة الروايات (على مستوى المحتوى الكامل أو فقرة محددة) |
| `TimelineEvent` | الخط الزمني العام ورحلة القصيدة (category: BIOGRAPHICAL/HISTORICAL/TRANSMISSION) |
| `TermOccurrence` | ربط كلمة في معجم `VocabularyTerm` بموضع ظهورها لتفعيل النقر عليها |
| `Narrator` + `Recording` | أرشيف الرواة الشفهي (تسجيلات صوتية موثقة الموافقة) |
| `Place.isSensitive` | إخفاء المواقع الحساسة في خريطة التراث |

طبقة API أولية مسجَّلة في `apps/api/src/modules/graph` (`GET /graph/:type/:id`,
`GET /graph/:type/:id/relations`, `GET|POST /graph/:type/:id/trust`,
`POST /graph/relations`) تكفي لبناء "مستكشف التراث" وبطاقة الثقة في الواجهة.

**غير مُنفَّذ بعد (يحتاج مرحلة لاحقة):**
- واجهات المستخدم (شاشة الاستكشاف التفاعلية، بطاقة الثقة المرئية، أرشيف
  الرواة، الخط الزمني، خريطة التراث) في `apps/web` و`apps/admin` و`apps/mobile`.
- نظام التوصية الذكي: يُبنى كخدمة تستعلم `EntityRelation` مباشرة، لا يحتاج
  نموذج بيانات جديدًا.
- المساعد الذكي (RAG): يحتاج بنية بحث متجهي (vector DB) غير موجودة حاليًا؛
  `Passage` مصمم ليكون وحدة الفهرسة المرشحة له لاحقًا، مع فصل واضح بين
  المحتوى الموثق (`status=PUBLISHED`, `verificationLevel=VERIFIED`) وغيره.
- توليد migration فعلية عبر `prisma migrate dev` يحتاج اتصالًا بقاعدة بيانات
  PostgreSQL حية؛ لم يُشغَّل في هذه البيئة لعدم توفر قاعدة بيانات محلية.
