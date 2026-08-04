# الأمن

- تشفير كلمات المرور باستخدام Argon2.
- Refresh token مخزن Hashed داخل DB.
- صلاحيات عبر Roles/Permissions.
- حدّية أخطاء تسجيل الدخول.
- تحقق إدخال عبر class-validator وDTO.
- لا توجد مفاتيح سرية داخل الكود (تأتي من env).
