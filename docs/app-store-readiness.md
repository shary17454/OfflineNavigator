# جاهزية App Store

هذه مراجعة مصدر وليست شهادة قبول من Apple. لم يُبنَ أو يُرفع أي تطبيق أثناء إعدادها. راجع قواعد الهوية في [`AGENTS.md`](../AGENTS.md)، وعملية الإصدار في [`release-process.md`](release-process.md)، وحقائق Xcode Cloud لرواية التراث في [`RAWAYA_XCODE_CLOUD.md`](RAWAYA_XCODE_CLOUD.md).

## حالة سريعة

| المنتج | جاهزية مؤكدة من المصدر | مانع/فجوة حالية |
| --- | --- | --- |
| مدّل | Bundle/Team/category/usage strings/privacy manifest/scheme وApp Icon موجودة | تعارض 1.0 مقابل README 1.1؛ App Store record وKVS provisioning غير مثبتين؛ يلزم Validate Archive للأيقونة |
| رواية التراث | App ID `6797734164` وBundle/Team/workspace/scheme وملفات App Icon موثقة | لا Privacy Manifest؛ endpoint تطوير HTTP؛ ميزات placeholders؛ أول Xcode Cloud workflow غير مثبت؛ يلزم Validate Archive للأيقونات |
| موروث | Bundle/Team/category/privacy manifest/scheme وApp Icon موجودة | لا App Store Connect App ID أو Xcode Cloud موثق؛ يلزم Validate Archive للأيقونة |

أي مانع في الجدول يعني **غير جاهز للإرسال** حتى يُغلق ويُتحقق من Archive فعلي.

## قائمة مشتركة إلزامية

### الهوية والبناء

- [ ] Bundle ID وTeam وDisplay Name يطابقان App Store Connect حرفيًا.
- [ ] Marketing version صحيح، ورقم البناء أعلى من آخر بناء مرفوع.
- [ ] Release Archive ينجح، وOrganizer Validate App بلا error.
- [ ] App Icon 1024×1024 وبقية الأحجام المطلوبة موجودة فعليًا، opaque ولا تحتوي alpha.
- [ ] التطبيق يعمل على الحد الأدنى المعلن وعلى iPhone وiPad (`TARGETED_DEVICE_FAMILY="1,2"`).
- [ ] لا placeholder، sample credential، عنوان localhost/emulator، أو بيانات تجريبية في Release.

### metadata والمراجعة

- [ ] الاسم، subtitle، description، keywords، category، copyright، support URL وprivacy policy URL مكتملة لكل locale.
- [ ] لقطات حديثة لكل مقاس جهاز مطلوب وتعكس الواجهة الحقيقية، لا ميزات مستقبلية.
- [ ] What's New يصف هذا البناء فقط.
- [ ] App Review Notes تشرح الميزات غير الواضحة، offline behavior، وأي إذن/حساب/خطوات اختبار.
- [ ] إن كان تسجيل الدخول مطلوبًا، حساب مراجعة صالح متوفر؛ إن لم يكن، لا تطلب metadata حساب.
- [ ] age rating، content rights، والإجابات المتعلقة بالمحتوى من إنشاء المستخدم دقيقة.

### الخصوصية والأمان

- [ ] App Privacy answers تطابق البيانات الفعلية وSDKs، لا Privacy Manifest فقط.
- [ ] Required Reason APIs لكل التطبيق وdependencies مغطاة في `PrivacyInfo.xcprivacy`.
- [ ] usage descriptions واضحة ومطابقة لوقت طلب الإذن.
- [ ] `ITSAppUsesNonExemptEncryption` وإجابات export compliance موثقة؛ المشاريع الحالية تضبطه `false` لمدّل وموروث، ويجب حسمه لرواية التراث.
- [ ] لا أسرار أو seed passwords أو logging لبيانات شخصية في البناء.
- [ ] روابط حذف الحساب مطلوبة إذا أصبح إنشاء الحساب متاحًا؛ شاشة auth placeholder لا تبرر الادعاء بوجود حسابات.

### الجودة المقاسة

- [ ] صفر crash/hang في 30 دقيقة smoke test لكل جهاز ممثل.
- [ ] صفر عيب حرج/عالٍ مفتوح، وصفر فشل test/build.
- [ ] cold launch إلى أول شاشة قابلة للاستخدام ≤ 5 ثوانٍ على أقدم جهاز مدعوم في اختبار release.
- [ ] التدفق الأساسي ينجح 10/10 مرات، بما في ذلك إعادة تشغيل وترقية بيانات محلية.
- [ ] معايير الوصول في [`accessibility.md`](accessibility.md) مستوفاة.

## مدّل

### حقائق metadata من المصدر

- Display Name: `مدّل` في `OfflineNavigator/Info.plist`.
- Category: `public.app-category.navigation`.
- الأذونات: When In Use location وMotion، بنصين عربيين.
- File sharing وopening documents in place مفعّلان لـGPX.
- `OfflineNavigator/PrivacyInfo.xcprivacy` يعلن precise location لوظائف التطبيق، بلا tracking.
- iCloud KVS entitlement موجود؛ Core Data يبقى التخزين الأساسي.

### قبل الإرسال

- [ ] تحقق عبر Release Archive من `OfflineNavigator/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` (الأبعاد، opacity، وasset compilation).
- [ ] احسم هل الإصدار 1.0 أم 1.1، ووحّد project/metadata/release notes بإجراء إصدار مقصود.
- [ ] أنشئ/تحقق من App Store record للـBundle ID؛ لا يوجد ASC numeric App ID في المستودع.
- [ ] تحقق أن capability الخاص بـiCloud KVS مفعّل في App ID وملف provisioning للتوزيع.
- [ ] App Privacy يذكر precise location بدقة، ويصف إن كانت نسخة KVS تنتقل إلى iCloud.
- [ ] راجع صياغة الاستخدام العربية مع واجهة التطبيق الإنجليزية المختلطة.
- [ ] اختبر وضع الطيران: لا تدّع أن Apple Map offline؛ الوصف الصحيح أن الشبكة والإحداثيات والحسابات تعمل بلا بلاطات.
- [ ] قدّم تنبيهًا واضحًا أن التطبيق لا يحل محل وسائل السلامة/الملاحة المعتمدة إن كان وصف المتجر يوحي بذلك.

## رواية التراث

### هوية مؤكدة

- App Store Connect name: **رواية التراث**.
- Numeric App ID: `6797734164`.
- Bundle ID: `com.shary17454.rawaya`; Display Name مطابق؛ Team `4HM66AD594`.
- مسار CI والصفحة موثقان في [`RAWAYA_XCODE_CLOUD.md`](RAWAYA_XCODE_CLOUD.md)، لكن نجاح Workflow/Archive غير مثبت في المصدر.

### موانع حالية

- [ ] تحقق عبر Release Archive من ملفات App Icon الموجودة في `Runner/Assets.xcassets/AppIcon.appiconset/` (كل الأحجام، opacity، وasset compilation).
- [ ] أضف/ولّد Privacy Manifest مناسبًا بعد جرد Flutter plugins وDio وSharedPreferences.
- [ ] استبدل `http://10.0.2.2:4000/api` بعنوان HTTPS production configurable، وتحقق من ATS.
- [ ] احذف نتائج البحث التجريبية أو ميّز failure صراحة؛ لا تعرضها كمحتوى حقيقي.
- [ ] لا تسوق المسارات التي تقود إلى `PlaceholderPage` كميزات مكتملة.
- [ ] طابق version `0.1.0+1` والنص الثابت «0.1.0 — MVP» مع App Store build المقصود.
- [ ] تحقق أن `Tajawal` محزم أو أزل ادعاء استخدامه؛ `pubspec.yaml` لا يعلن ملفات خط.
- [ ] أصلح/انقل CI GitHub إن كان مطلوبًا؛ موضع `rawayah/.github/workflows/` ومساراته لا يعملان من جذر هذا repo.
- [ ] أنشئ أول Xcode Cloud workflow يدويًا وتحقق من build بدل الاستدلال من وجود السكربتات.

### محتوى المنصة

- [ ] Privacy Policy وTerms وسياسة moderation/reporting منشورة ومتاحة داخل التطبيق قبل محتوى المستخدم.
- [ ] حقوق نشر الشعر والكتب والصور موثقة، وآلية البلاغ/الحظر/الاستجابة متاحة إذا أصبح UGC فعليًا.
- [ ] إذا فُعّلت subscriptions لاحقًا، استخدم In-App Purchase وأكمل agreements/metadata/restore.
- [ ] endpoint production وbackend يخضعان لاختبار أمان/خصوصية، وحسابات seed وكلمات placeholder غير موجودة في الإنتاج.
- [ ] الدفتر المحلي يبقى بعد upgrade، وتشرح الخصوصية أنه في SharedPreferences على الجهاز حاليًا.

## موروث

### حقائق metadata من المصدر

- Display Name: `موروث`; development region `ar`.
- Category: `public.app-category.books`.
- لا أذونات حساسة أو networking ظاهرة في `Info.plist`.
- `Riwaya/PrivacyInfo.xcprivacy` يعلن no tracking/no collection وUserDefaults reason `CA92.1`.
- Core Data محلي وتصدير نص عبر share sheet.

### قبل الإرسال

- [ ] تحقق عبر Release Archive من `Riwaya/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` ومن الألوان/alpha.
- [ ] أنشئ/تحقق من App Store record والـnumeric App ID؛ لا قيمة موثقة حاليًا.
- [ ] لا تستخدم `docs/MAWROOTH_XCODE_CLOUD.md` كإثبات؛ محتواه يحيل إلى App ID رواية التراث.
- [ ] تحقق من صحة إجابة «Data Not Collected» بعد فحص كل binary/SDK في Archive.
- [ ] اختبر حفظ Core Data والترقية وعدم فقد الروايات والفصول.
- [ ] اختبر تصدير نص عربي واتجاهه وترميزه في Files/Mail/Share Sheet.
- [ ] طابق وصف المتجر مع نطاق التطبيق المحلي: لا حساب، لا مزامنة، لا شبكة.
- [ ] راجع الاسم التجاري «موروث» مقابل أسماء المشروع `Riwaya` ووصف README لتجنب metadata مربكة.

## قرار go/no-go

يوقع مالك الإصدار على جدول لكل بند: `Pass / Fail / Not applicable / Not verified` مع دليل (رابط build، لقطة، سجل اختبار). القرار **No-Go** تلقائيًا عند مانع هوية/توقيع/أيقونة/خصوصية، crash أو فقد بيانات، endpoint تطوير، أو ميزة متجر غير موجودة في التطبيق.
