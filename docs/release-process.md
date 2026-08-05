# عملية الإصدار

هذه العملية مبنية على إعدادات المستودع الحالية. اتبع قيود [`AGENTS.md`](../AGENTS.md)، ولمنصة موروث اتبع كذلك [`RAWAYA_XCODE_CLOUD.md`](RAWAYA_XCODE_CLOUD.md). لا تغيّر Bundle ID أو Team أو أرقام الإصدار ضمن إصلاح عابر.

## هويات الإصدار الفعلية

| المنتج | المشروع / Workspace | Scheme | Bundle ID | Team | iOS | الإصدار في المصدر |
| --- | --- | --- | --- | --- | --- | --- |
| مدّل | `OfflineNavigator.xcodeproj` | `OfflineNavigator` | `com.shary17454.OfflineCoordinateNavigator` | `4HM66AD594` | 17.0 | `MARKETING_VERSION=1.0`, build `2` |
| موروث (Rawaya) | `rawayah/apps/mobile/ios/Runner.xcworkspace` | `Runner` | `com.shary17454.rawaya` | `4HM66AD594` | 13.0 | `rawayah/apps/mobile/pubspec.yaml`: `0.1.0+1`; Xcode يأخذ `FLUTTER_BUILD_NAME/NUMBER` |
| موروث | `Riwaya.xcodeproj` | `Riwaya` | `com.shary17454.Riwaya` | `4HM66AD594` | 17.0 | `MARKETING_VERSION=1.0`, build `1` |

كل schemes الثلاثة shared وتسمح بالـArchive. أهداف الاختبار هي `OfflineNavigatorTests`, `RunnerTests`, و`RiwayaTests`.

## بوابة الإصدار المشتركة

1. حدد منتجًا واحدًا ورقم إصدار/بناء جديدين؛ رقم البناء يجب أن يكون أعلى من آخر بناء في App Store Connect، ولا يمكن إثبات ذلك من المستودع وحده.
2. راجع diff منذ آخر tag/إصدار، migrations، الخصوصية، dependencies، والنصوص المعروضة.
3. نفذ بوابات المنتج أدناه وسجّل الأمر، البيئة، النتيجة، ومرجع الـcommit.
4. أنشئ Release archive موقّعًا على macOS/Xcode مدعوم، ثم افحصه بـOrganizer Validate App.
5. ارفع إلى TestFlight فقط بعد المرور، ونفذ smoke test على جهاز حقيقي من البناء الموزع.
6. أكمل metadata والخصوصية واللقطات، ثم أرسل للمراجعة يدويًا بعد موافقة مالك المنتج.

معيار البوابة: **صفر فشل build/test، صفر crash في smoke test، صفر عيب حرج/عالٍ مفتوح، وصفر تغيير هوية غير مقصود**. أي خطوة لم تُنفذ تُسجل «غير متحقق» ولا تُستبدل بنتيجة قديمة.

## مدّل

### قبل البناء

- عالج قرار الإصدار صراحة: `README.md` يقول 1.1 بينما `OfflineNavigator.xcodeproj/project.pbxproj` يحدد 1.0. لا تُرفع قيمة منهما تلقائيًا.
- تحقق من App ID/provisioning لامتياز KVS في `OfflineNavigator/OfflineNavigator.entitlements`؛ القيمة تستخدم `$(TeamIdentifierPrefix)$(CFBundleIdentifier)`.
- راجع `OfflineNavigator/PrivacyInfo.xcprivacy` وإفصاح precise location مع الاستخدام الفعلي.
- تحقق عبر Release Archive من صورة `OfflineNavigator/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` الموجودة ومن نجاح asset compilation.

### أوامر مرجعية على macOS

```sh
xcodebuild test \
  -project OfflineNavigator.xcodeproj \
  -scheme OfflineNavigator \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=<installed simulator>'

xcodebuild archive \
  -project OfflineNavigator.xcodeproj \
  -scheme OfflineNavigator \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath /tmp/OfflineNavigator.xcarchive
```

لا يوجد في المستودع دليل على Xcode Cloud workflow لمدّل. لا تصفه بأنه مفعّل قبل التحقق في App Store Connect.

### Smoke test

- إذن الموقع: allow/deny؛ حفظ/حذف نقطة؛ دقة GPS.
- Apple Map مقابل Offline Grid في وضع الطيران.
- GPX: استيراد `wpt/rtept/trkpt` وتصدير وفتح الملف.
- البوصلة والمسافة والاتجاه والتنبيه عند الاقتراب.
- نسخ iCloud واستعادة النقاط على حساب مؤهل، مع التأكد أن الفشل لا يمس Core Data.

## موروث (Rawaya)

### حقائق Xcode Cloud

- App Store Connect: **موروث**، App ID `6797734164`.
- صفحة CI المسجلة موجودة في [`RAWAYA_XCODE_CLOUD.md`](RAWAYA_XCODE_CLOUD.md).
- Workspace `rawayah/apps/mobile/ios/Runner.xcworkspace` وScheme `Runner`.
- `ci_scripts/` في الجذر يفوض إلى `rawayah/apps/mobile/ios/ci_scripts/`.
- `ci_post_clone.sh` يثبت Flutter stable عند غيابه ثم ينفذ `flutter pub get` و`flutter test`.
- `ci_pre_xcodebuild.sh` ينفذ `flutter build ios --release --no-codesign`.
- الوثيقة الحالية تقول إن إنشاء أول Workflow ما زال يدويًا في Xcode؛ وجود السكربتات لا يثبت أن workflow أنشئ أو أن بناء Cloud نجح.

### فجوات CI يجب عدم إخفائها

- workflow فعّال للجوال موجود في `.github/workflows/rawaya-ci.yml` ويشغّل analyze/test/iOS release build من `rawayah/apps/mobile/`. فحص Node منفصل مؤجل لأن `prisma generate` يكشف 25 علاقة schema بلا opposite field؛ لا تخفِ هذا الخلل داخل gate الجوال.
- `PrivacyInfo.xcprivacy` موجود تحت Runner ومضاف إلى Resources؛ يجب تأكيده في تقرير Archive.
- ملفات App Icon المخصصة موجودة في `rawayah/apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/`، لكن صلاحيتها للمتجر لا تُثبت إلا بـValidate Archive (الأبعاد، opacity، وربط الـasset).
- `ApiClient` يقرأ `API_BASE_URL` من بيئة البناء ويرفض أي قيمة غير HTTPS؛ التدفقات المحلية الحالية لا تعتمد على الخادم.

### بوابات المنصة والجوال

من `rawayah/`:

```sh
npm ci
npx prisma generate --schema apps/api/prisma/schema.prisma
npm run lint
npm run build
npm run test
```

ومن `rawayah/apps/mobile/`:

```sh
flutter pub get
flutter analyze
flutter test
flutter build ios --release --no-codesign
```

ثم Archive موقّع من `Runner.xcworkspace`. لا ترفع بناءً يعرض `PlaceholderPage` كميزة مكتملة، نتائج بحث fallback تجريبية، أو عنوان API التطويري.

### Smoke test

- Splash/Home، حالات API success/offline/error، البحث بلا نتائج وبنتائج حقيقية.
- إنشاء مساهمة وفصل، حفظ نص طويل، إغلاق/إعادة تشغيل، والقراءة offline.
- ترقية من نسخة TestFlight السابقة مع بقاء `rawaya_offline_works_v1`.
- العربية/RTL والوصول. المنصة web/admin/API لها بوابة مستقلة حتى لو كان الإصدار المطلوب iOS.

## موروث

### قبل البناء

- تحقق من `Riwaya/PrivacyInfo.xcprivacy`: لا tracking/collection ويعلن UserDefaults reason `CA92.1`.
- التطبيق محلي بلا شبكة بحسب الكود؛ أي إضافة شبكة تستلزم مراجعة الخصوصية والـmetadata.
- تحقق عبر Release Archive من `Riwaya/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` الموجود ومن نجاح asset compilation.
- لا يوجد دليل مستودع على App Store Connect App ID أو Xcode Cloud workflow لتطبيق SwiftUI في `Riwaya/`. `docs/MAWROOTH_XCODE_CLOUD.md` يحيل فعليًا إلى هوية منصة **موروث** في `rawayah/` ولا يثبت هوية تطبيق SwiftUI.

### أوامر مرجعية على macOS

```sh
xcodebuild test \
  -project Riwaya.xcodeproj \
  -scheme Riwaya \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=<installed simulator>'

xcodebuild archive \
  -project Riwaya.xcodeproj \
  -scheme Riwaya \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath /tmp/Riwaya.xcarchive
```

### Smoke test

- إنشاء/تعديل/تفضيل/حذف رواية وفصل، مع إعادة تشغيل التطبيق.
- نص عربي طويل، حفظ تلقائي، ترتيب الفصول وإحصاء الكلمات.
- ثيمات القراءة وحجم الخط والتباعد، السابق/التالي.
- تصدير النص وفتحه/مشاركته، وعدم فقد Core Data عند الترقية.

## سجل الإصدار الأدنى

- المنتج، Bundle ID، version/build، commit/tag.
- إصدار Xcode/Flutter/Node والجهاز/المحاكي.
- نتائج الأوامر وروابط CI/TestFlight إن وجدت.
- migrations/خصوصية/entitlements المتغيرة.
- نتائج checklists في [`app-store-readiness.md`](app-store-readiness.md) و[`accessibility.md`](accessibility.md).
- ما لم يُختبر ولماذا، وقرار go/no-go واسم الموافق.
