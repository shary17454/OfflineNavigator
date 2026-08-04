# رواية التراث — إعداد Xcode Cloud

تم تسجيل التطبيق في Apple ومطابقته في هذا المستودع.

## هوية Apple المسجّلة

| العنصر | القيمة |
| --- | --- |
| اسم App Store Connect | **رواية التراث** |
| App ID | `6797734164` |
| Bundle ID | `com.shary17454.rawaya` |
| Display Name على الجهاز | رواية التراث |
| Team | `4HM66AD594` |
| صفحة Xcode Cloud | https://appstoreconnect.apple.com/teams/26cc2279-524d-4d33-ba75-9333cf111ad1/apps/6797734164/ci |

## مسارات المشروع

| العنصر | المسار |
| --- | --- |
| Workspace | `rawayah/apps/mobile/ios/Runner.xcworkspace` |
| Scheme | `Runner` |
| سكربتات CI | `rawayah/apps/mobile/ios/ci_scripts/` + `ci_scripts/` في جذر المستودع |

## الخطوة المتبقية (يدوية في Xcode)

1. افتح Xcode.
2. من القائمة: **Integrate → Create Workflow…**
3. اختر:
   - **App:** رواية التراث
   - **Workspace:** `rawayah/apps/mobile/ios/Runner.xcworkspace`
   - **Scheme:** `Runner`
   - **Branch:** `main` (بعد دمج هذا الـPR) أو `codex/rawaya-mvp-xcode-cloud-proper` في `my-codex`
4. ابدأ أول بناء Xcode Cloud.

## حالة التحقق السابقة (Codex)

- `npm run build` نجح
- `npm run test` نجح
- `flutter test` نجح
- بناء iOS المحلي تعطل بسبب صلاحيات/metadata في Flutter SDK المحلي، وليس بسبب كود التطبيق

## ملاحظة

إنشاء Workflow الأول ورفع البناء لـ App Store Connect يتم من Xcode على Mac؛ الإعدادات والـBundle ID في المستودع مطابقة لما سُجّل في Apple.
