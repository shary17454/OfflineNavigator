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
