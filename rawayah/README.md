# موروث (Rawaya)

منصة رقمية عربية لحفظ وصون التراث العربي والبدوي.

> المسار: `rawayah/`  
> Bundle ID المسجّل في Apple: `com.shary17454.rawaya`  
> اسم App Store Connect: **موروث** (App ID `6797734164`)

## المتطلبات
- Node.js 20+
- PostgreSQL
- Redis
- Flutter 3.4+

## التشغيل السريع
```bash
npm install
cp .env.example .env
npm run docker:dev
```

## تشغيل الخدمات
- API: `http://localhost:4000/api`
- واجهة الويب: `http://localhost:3001`
- لوحة الإدارة: `http://localhost:3002`
- Swagger: `http://localhost:4000/api/docs`

## التطبيق الجوال
```bash
cd apps/mobile
flutter pub get
flutter run
```

من الشاشة الرئيسية يمكن فتح **دفتر دون اتصال** لكتابة وقراءة المساهمات محليًا بدون إنترنت.

## Xcode Cloud
راجع `../docs/RAWAYA_XCODE_CLOUD.md`.

Workspace: `apps/mobile/ios/Runner.xcworkspace` — Scheme: `Runner`

## المتغيرات
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `REDIS_URL`

## حسابات Seed
- admin@rawaya.test
- editor@rawaya.test
- user@rawaya.test

> ملاحظة: كلمات المرور في seed أولية placeholder، يجب استبدالها.

## أوامر مفيدة
- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run docker:prod`
- `cd apps/mobile && flutter test`
- `cd apps/mobile && flutter build ios --release --no-codesign`
