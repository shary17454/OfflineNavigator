# موروث — إعداد Xcode Cloud

تطبيق **موروث** (Flutter iOS) جاهز للربط مع Xcode Cloud من هذا المستودع.

## المسارات المهمة

| العنصر | المسار |
| --- | --- |
| مشروع Xcode | `rawayah/apps/mobile/ios/Runner.xcworkspace` |
| Scheme | `Runner` |
| Bundle ID | `com.shary17454.mawrooth` |
| Display Name | موروث |
| Team | `4HM66AD594` |
| سكربتات CI | `rawayah/apps/mobile/ios/ci_scripts/` و`ci_scripts/` في جذر المستودع |

## خطوات الربط في App Store Connect / Xcode

1. افتح [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → أنشئ تطبيقًا جديدًا باسم **موروث** (إن لم يكن موجودًا) بـ Bundle ID `com.shary17454.mawrooth`.
2. من **Xcode** على Mac: افتح  
   `rawayah/apps/mobile/ios/Runner.xcworkspace`
3. قائمة **Product → Xcode Cloud → Create Workflow…**
4. اختر المستودع `OfflineNavigator` (أو أضف GitHub إذا لزم).
5. إعدادات Workflow المقترحة:
   - **Project**: `Runner.xcworkspace`
   - **Scheme**: `Runner`
   - **Branch start condition**: `main` أو فرع هذا الـPR
   - **Actions**: Archive / Build for iOS
6. تأكد أن سكربتات `ci_post_clone` و`ci_pre_xcodebuild` تعمل (تثبّت Flutter ثم `flutter build ios`).
7. اربط Signing بـ Apple Development Team `4HM66AD594` عبر Automatic signing في Xcode Cloud.
8. Start Build.

## ملاحظات

- بيئة Cloud Agent هنا Linux؛ لا يمكن تشغيل Xcode Cloud build فعليًا منها. الإعداد والسكربتات جاهزة للتشغيل من حسابك على Apple.
- بعد أول workflow، راقب السجل: فشل شائع = مسار Flutter أو CocoaPods. السكربتات تعالج Flutter install و`pub get`.
- اسم العرض على الجهاز: **موروث**.
