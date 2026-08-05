# الصيانة

هدف الصيانة حماية بيانات المستخدم واستمرار قابلية الإصدار من دون خلط المنتجات. ترتيب الأولويات وقواعد التعديل في [`AGENTS.md`](../AGENTS.md)، وعملية التوزيع في [`release-process.md`](release-process.md). حقائق Xcode Cloud الخاصة بمنصة موروث فقط في [`RAWAYA_XCODE_CLOUD.md`](RAWAYA_XCODE_CLOUD.md).

## إيقاع وفحص قابل للقياس

### مع كل تغيير

- diff محصور بالمنتج المطلوب؛ صفر تغيير عرضي في Bundle ID/Team/version/deployment target.
- شغّل اختبارات المنتج المتأثرة، وسجّل ما لم يمكن تشغيله. صفر assertion محذوف لإخفاء فشل.
- عند تغيير تخزين: اختبار round-trip وترقية وrollback/فشل؛ صفر فقد بيانات.
- عند تغيير واجهة: checklist الوصول وRTL/Dynamic Type في [`accessibility.md`](accessibility.md).

### شهريًا أو قبل كل إصدار

- راجع dependencies والأدوات، advisories، انتهاء شهادات/ملفات provisioning، وحالة endpoints.
- نفّذ clean build/test على بيئة macOS معتمدة وسجّل مدة ونتيجة.
- راجع warnings؛ الهدف صفر warning جديد، وكل warning قديم له owner/سبب.
- افحص Archive للـicons، privacy manifests، entitlements، version/build، وبيئة production.
- جرّب restore/upgrade من آخر نسخة متجر على بيانات ممثلة.

### ربع سنويًا

- اختبر أقدم iOS مدعوم وأحدث iOS/Xcode.
- راجع App Privacy وRequired Reason APIs وسياسات المتجر.
- قِس cold launch، الذاكرة في التدفق الأساسي، وحجم البيانات المحلية. قارن بالخط الأساسي السابق؛ أي تراجع >20% يحتاج تفسيرًا.
- احذف dependency فقط بعد إثبات عدم الاستخدام وبـPR مستقل؛ لا تحديثات جماعية غير مرتبطة.

## مدّل (`OfflineNavigator/`)

### مناطق الملكية

- UI/تنسيق التدفق: `OfflineNavigator/ContentView.swift`.
- الموقع والحركة: `Services/LocationMotionManager.swift`.
- الحسابات النقية: `Services/NavigationMath.swift`.
- GPX: `Services/GPXService.swift`.
- Core Data: `Services/PersistenceController.swift` و`Models/Waypoint.swift`.
- iCloud KVS: `Services/ICloudBackupService.swift` و`OfflineNavigator.entitlements`.
- اختبارات: `OfflineNavigatorTests/NavigationMathTests.swift`, `GPXServiceTests.swift`, `ICloudBackupServiceTests.swift`.

### دين ومخاطر حالية

| أولوية | الفجوة | توصية آمنة / معيار الإغلاق |
| --- | --- | --- |
| بوابة إصدار | App Icon موجود لكن لم يُتحقق منه في Archive | تحقق من الأبعاد وopacity وasset compilation عبر Validate Archive |
| عالٍ | `ContentView` يجمع UI والاستيراد/التصدير/الحفظ والمشاركة | استخرج منطقًا نقيًا فقط عند تغييره، مع regression tests؛ لا تفرض MVVM شاملًا |
| عالٍ | KVS يحتاج provisioning حقيقي وسعة محدودة | اختبر backup/restore والفشل على حساب فعلي؛ Core Data يبقى source of truth |
| متوسط | GPX `trkpt` قد يحتوي آلاف النقاط | benchmark بملفات 1k/10k نقطة؛ لا زيادة >20% في الذاكرة/الزمن دون قرار |
| متوسط | واجهة AR/EN مختلطة | قرار توطين مستقل باستخدام Strings Catalog؛ لا ترقيع نصوص متفرقة |
| متوسط | README 1.1 مقابل project 1.0 | حسمه في عملية إصدار فقط |

### مؤشرات صحة

- `OfflineNavigatorTests` كلها تمر؛ أضف حالة malformed GPX وحدود إحداثيات لكل bug parser.
- دقة `NavigationMath` تبقى ضمن tolerance الاختبارات الحالية.
- استيراد ملف 10,000 نقطة لا ينهار ولا يجمد الواجهة زمنًا غير مقبول؛ سجّل baseline على جهاز ممثل.
- backup لا يحذف نقطة محلية عند conflict/failure، والاستعادة «missing only» تبقى idempotent.

## موروث (`rawayah/`)

### مناطق الملكية

- workspace scripts: `rawayah/package.json`.
- API/Nest/Prisma: `rawayah/apps/api/`, schema في `apps/api/prisma/schema.prisma`.
- Web/Admin: `rawayah/apps/web/`, `rawayah/apps/admin/`.
- Flutter: `rawayah/apps/mobile/lib/`; التخزين المحلي في `features/offline/offline_models.dart`.
- iOS/Xcode Cloud: `rawayah/apps/mobile/ios/` و`ci_scripts/`.

### دين ومخاطر حالية

| أولوية | الفجوة | توصية آمنة / معيار الإغلاق |
| --- | --- | --- |
| تحقق إصدار | Privacy Manifest وApp Icon مخصص موجودان لكنهما غير متحققين في Archive | نفّذ Validate Archive وافحص تقرير الخصوصية والأيقونة |
| تحقق إصدار | `API_BASE_URL` اختياري للتدفقات المستقبلية ويُقبل فقط كـHTTPS | مرّر عنوان production في workflow عند تفعيل ميزات الخادم، واختبر رفض القيم غير الآمنة |
| عالٍ | معظم routes هي `PlaceholderPage` وSearch يعرض fallback تجريبي | feature inventory صادق؛ لا expose/market حتى اكتمال success/error/empty tests |
| عالٍ | الدفتر JSON كامل في SharedPreferences (`rawaya_offline_works_v1`) | لا تغيّر المفتاح/الشكل بلا migration؛ انقل لقاعدة محلية فقط بتصميم وترقية واختبار حجم |
| تحقق CI | workflow الجذر يتحقق من Flutter/iOS فقط؛ Prisma schema يفشل التوليد بسبب 25 علاقة بلا opposite field | أبقِ إصدار الجوال مستقلًا، وأضف CI للمنصة بعد إصلاح schema بعلاقات ومهاجرات مراجعة |
| متوسط | Xcode Cloud ينزّل Flutter stable غير مثبت الإصدار | pin نسخة/commit متوافقة وسجلها لتكرارية البناء |
| متوسط | `Tajawal` غير معرّف كasset | حزم الخط وترخيصه أو استخدم خط نظام |
| متوسط | catch واسع يحول فشل الشبكة إلى محتوى تجريبي | نمذج error/offline، logging بلا PII، واختبارات حالات HTTP |

### مؤشرات صحة

- `npm run lint`, `npm run build`, `npm run test`, `flutter analyze`, `flutter test`, و`flutter build ios --release --no-codesign`: صفر فشل قبل الإصدار.
- migrations تُجرّب على نسخة من schema السابق؛ لا `db push` مدمر في الإنتاج.
- API p95 للتدفقات الأساسية له baseline متفق عليه؛ أي تراجع >20% يوقف الإصدار حتى التفسير.
- اختبار ترقية يحفظ عينة دفتر كبيرة عبر تغيير الإصدار؛ checksum/عدد الأعمال والفصول متطابق.
- Xcode Cloud لا يعد ناجحًا إلا برابط build فعلي، لا بمجرد وجود السكربتات. راجع [`RAWAYA_XCODE_CLOUD.md`](RAWAYA_XCODE_CLOUD.md).

## موروث (`Riwaya/`)

### مناطق الملكية

- التدفق: `Riwaya/Views/LibraryView.swift`, `NovelDetailView.swift`, `NovelEditorView.swift`.
- التحرير/القراءة: `ChapterEditorView.swift`, `ReaderView.swift`, `SettingsView.swift`.
- Core Data: `Services/PersistenceController.swift`, `Models/Novel.swift`, `Models/Chapter.swift`, و`Riwaya.xcdatamodeld`.
- التصدير/الإحصاءات: `Services/NovelExportService.swift`, `TextStats.swift`.
- اختبارات: `RiwayaTests/TextStatsTests.swift`.

### دين ومخاطر حالية

| أولوية | الفجوة | توصية آمنة / معيار الإغلاق |
| --- | --- | --- |
| بوابة إصدار | App Icon موجود لكن لم يُتحقق منه في Archive | تحقق من الأبعاد وopacity وasset compilation عبر Validate Archive |
| عالٍ | لا اختبارات persistence/migration أو تدفقات UI | أضف in-memory Core Data tests قبل أي model migration واختبار ترقية جهاز |
| عالٍ | منطق أعمال داخل `LibraryView`/الشاشات | استخراج موضعي عند إضافة منطق قابل للاختبار؛ لا إعادة معمارية شاملة |
| متوسط | «حفظ تلقائي» يحتاج ضمان فشل واضح | اختبارات lifecycle والخروج المفاجئ؛ لا swallow لأخطاء save |
| متوسط | ألوان الأغلفة من `coverHue` | اختبارات/لقطات تباين لقيم ممثلة 0, .25, .5, .75, 1 |
| متوسط | لا App Store/Xcode Cloud identity موثقة | سجل ASC App ID/workflow فقط بعد التحقق الخارجي؛ لا تعيد استخدام App ID منصة موروث |

### مؤشرات صحة

- `RiwayaTests` تمر، مع حالات عربية/Unicode/نص فارغ وكبير لـ`TextStats` والتصدير.
- فتح/حفظ 100 رواية و1,000 فصل بلا crash؛ قِس baseline قبل تحسين الأداء.
- ملف التصدير UTF-8 مطابق للنص/ترتيب الفصول، ويمكن فتحه بعد المشاركة.
- migration يحافظ على عدد الروايات والفصول والعلاقات والمفضلة؛ صفر orphan أو فقد.

## إدارة dependencies والأدوات

- SwiftUI apps لا تعرض package dependencies خارج أطر Apple حاليًا؛ لا تضف مكتبة لمهمة يمكن تنفيذها بأطر النظام من دون مبرر.
- Flutter/Dart versions وNode 20+ موثقة، و`pubspec.lock` محفوظ لقابلية إعادة بناء التطبيق. راجع تغييرات `package-lock.json` و`pubspec.lock` في أي تحديث dependencies.
- حدّث dependency واحدة أو مجموعة مترابطة لكل تغيير، اقرأ changelog، شغّل الاختبارات، وافحص privacy/permissions.
- لا ترفع iOS 13/17 targets أو Swift 5.0 تلقائيًا عند تحديث Xcode.

## قالب سجل صيانة

```text
المنتج:
المرجع/commit:
الأداة وإصدارها:
الفحوص المنفذة ونتائجها:
قياسات قبل/بعد:
تأثير البيانات/الهجرة:
تأثير الهوية/الخصوصية:
غير متحقق:
المتابعة والمالك:
```

يبقى العيب في السجل حتى يملك دليل إغلاق. لا تُحوّل «لم يُختبر» إلى «يمر» استنادًا إلى README أو نتيجة تاريخية.
