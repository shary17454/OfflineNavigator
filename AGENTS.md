# AGENTS.md — المرجع الرسمي لمستودع OfflineNavigator

> أي وكيل أو مطور يعمل في هذا المستودع **ملزم** بهذا الملف وما يرتبط به تحت [`docs/`](docs/README.md).
> لا تطبّق قوالب مشاريع أخرى. اعمل فقط بما هو موجود هنا.

---

## 1) وصف المشروع

هذا المستودع **متعدد المنتجات** (polyrepo داخل repo واحد) تحت حساب Apple Team `4HM66AD594`. يضم ثلاثة تطبيقات مستقلة المجال، تشترك في الملكية والمستودع فقط:

| المنتج | المسار / المشروع | Bundle ID | الغرض |
| --- | --- | --- | --- |
| **مدّل** (Offline Navigator) | `OfflineNavigator.xcodeproj` | `com.shary17454.OfflineCoordinateNavigator` | ملاحة إحداثيات ميدانية دون اتصال |
| **رواية التراث** (Rawaya) | `rawayah/` | `com.shary17454.rawaya` | منصة تراث عربي (API + Web + Admin + Flutter) — تطبيق ASC App ID `6797734164` |
| **موروث** (Riwaya SwiftUI) | `Riwaya.xcodeproj` | `com.shary17454.Riwaya` | دفتر روايات محلي iOS أصلي (مكمّل لفكرة الدفتر دون اتصال في Flutter) |

لا تخلط نطاقات المنتجات: خطأ في مدّل لا يُصلح بتغيير Prisma، والعكس.

---

## 2) أهداف التطبيقات

### مدّل
حفظ نقاط GPS، حساب المسافة والاتجاه محليًا، بوصلة، خريطة Apple أو شبكة دون بلاطات، GPX استيراد/تصدير، مشاركة روابط خرائط، نسخ احتياطي اختياري عبر `NSUbiquitousKeyValueStore`.

### رواية التراث (`rawayah/`)
منصة محتوى تراثي (شعر، قصص، كتب، خيل، إبل، صقارة، …) مع NestJS/Prisma، واجهات Next، وتطبيق Flutter. يتضمن **دفتر دون اتصال** محليًا في Flutter مستوحى من تطبيق Riwaya.

### موروث (SwiftUI)
كتابة/قراءة فصول محليًا بـ Core Data، قارئ بثيمات، تصدير نص — بدون شبكة.

---

## 3) البنية الحالية (ملخص)

### مدّل / موروث (SwiftUI)
- دخول: `*App.swift` → حقن `NSManagedObjectContext`
- طبقات فعلية: `Views/` + `Services/` + `Models/` + Core Data model
- **ليست** MVVM صارمة؛ منطق الأعمال غالبًا في الشاشة الجذر (`ContentView` لمدّل، `LibraryView` لموروث)
- حالة: `@StateObject` / `@FetchRequest` / `@AppStorage` / `@State`

### رواية التراث
- Monorepo npm workspaces: `apps/api|web|admin|mobile` + `packages/*` (حاليًا placeholders)
- API: Nest modules تحت `apps/api/src/modules/*`
- Mobile: Riverpod + go_router + Dio؛ معظم المسارات ما زالت `PlaceholderPage`
- Offline: JSON في SharedPreferences (`rawaya_offline_works_v1`)

تفاصيل أعمق: [docs/architecture.md](docs/architecture.md) و [docs/project-structure.md](docs/project-structure.md) و [docs/rawayah-platform.md](docs/rawayah-platform.md).

---

## 4) مسؤوليات الوكيل

1. فهم المنتج المستهدف قبل أي تعديل (أي صف في الجدول أعلاه).
2. قراءة الوثائق المرتبطة في `docs/` و`README` الخاص بالمنتج.
3. تنفيذ **أقل تغيير صحيح** يحقق الطلب.
4. عدم خلط هويات Apple (لا تغيّر Bundle ID / الاسم / Team دون طلب صريح).
5. حماية بيانات المستخدم المحلية (Core Data / SharedPreferences / KVS).
6. توثيق ما تم وما لم يُختبر في تقرير نهائي صادق.
7. عدم Commit/Push/PR إلا إذا طُلب صراحة أو كانت مهمة Cloud Agent تتطلب تسليمًا — عندها فرع `cursor/...-a8fc` ووصف دقيق.

---

## 5) قواعد العمل داخل هذا المستودع

- اعمل على **المنتج/المسار المذكور في المهمة فقط**.
- لا تعِد تنظيم المجلدات أو تعِد تسمية واسعة.
- لا تحذف ميزات أو ملفات أو Assets أو اختبارات دون طلب.
- لا تحدّث dependencies أو ترفع Deployment Target دون طلب.
- لا تستخدم أوامر Git مدمرة (`reset --hard`, `clean -fd`, force push, …).
- لا تلمس تعديلات Uncommitted ليست لك.
- ميّز بين: مدّل (ملاحة) ≠ رواية التراث (منصة) ≠ موروث SwiftUI (دفتر).
- اللغة العربية وRTL إلزامية في واجهات رواية/موروث؛ مدّل حاليًا مختلط AR/EN — لا توسّع الترجمة إلا بطلب.

---

## 6) أولويات التطوير (إلزامي عند التعارض)

1. حماية بيانات المستخدم
2. صحة تنفيذ الطلب
3. منع Crashes
4. عدم كسر الميزات الحالية
5. الأمان والخصوصية
6. التوافق مع الإعدادات الحالية
7. UX وإمكانية الوصول
8. الأداء
9. قابلية الصيانة
10. تحسينات اختيارية

---

## 7) معايير الجودة

| معيار | قياس عملي في هذا المستودع |
| --- | --- |
| بناء | `xcodebuild` لـ OfflineNavigator أو Riwaya؛ `npm run build` للمنصة؛ `flutter build ios --release --no-codesign` + Xcode Cloud scripts للجوال. `flutter analyze` غير متاح كـgate حاليًا حتى إضافة `flutter_lints` إلى dev dependencies |
| اختبارات | لا تحذف/تُضعف Assertions؛ أضف Regression عند إصلاح منطق قابل للاختبار (`NavigationMath`, `GPXService`, `TextStats`, Nest unit) |
| Diff | ملفات المهمة فقط؛ لا تنسيق جماعي |
| أسرار | لا JWT secrets أو مفاتيح في الكود؛ لا تعطيل ATS بلا طلب |
| بيانات | لا Migration مكسورة؛ لا مسح UserDefaults/Core Data |

---

## 8) قواعد مراجعة الكود

- هل التغيير يمس المنتج الصحيح؟
- هل يحافظ على Source of Truth الحالي (Core Data / Prisma / SharedPreferences)؟
- هل يضيف Force Unwrap / `fatalError` جديدًا في مسار مستخدم؟
- هل يعالج الأخطاء أم يبتلعها (`try?` / rollback صامت كما في `PersistenceController.save`)؟
- هل الاختبار يغطي المنطق النقي المضاف؟
- هل تغيّرت هوية Apple أو Signing عرضًا؟

---

## 9) قواعد الإصلاح

- عالج السبب الجذري لا العرض.
- إصلاح مشابه لنفس السبب الجذري فقط إن كان صغيرًا وآمنًا.
- خارج النطاق: وثّق ولا تصلح (إلا Crash/فقدان بيانات/ثغرة/كسر بناء ناتج عن تعديلك).

---

## 10) قواعد Refactoring

- ممنوع Refactor «للتجميل» أو نقل معماري (مثل فرض MVVM على مدّل).
- مسموح استخراج دالة/نوع داخل الملفات المتأثرة إذا قلّل التكرار الناتج عن المهمة.
- لا تعِد كتابة ملفات ضخمة (`ContentView.swift`) كاملة إذا يكفي تعديل موضعي.

---

## 11) قواعد الاختبارات

- شغّل ما يخص المهمة:
  - مدّل: `OfflineNavigatorTests`
  - موروث: `RiwayaTests`
  - rawayah: `apps/api` jest، `apps/mobile` `flutter test`
- لا تعطّل اختبارًا فاشلًا؛ لا تغيّر المتوقع لإخفاء خلل.
- بيئة Linux Cloud غالبًا **بدون** `xcodebuild`/`flutter` — اذكر «لم يتم التحقق» بدل الادعاء.

---

## 12) قواعد الأداء

- لا عمل ثقيل في `body` / على Main Thread (مدّل: موقع متكرر؛ رواية: قوائم فصول طويلة).
- GPX `trkpt` قد يستورد آلاف النقاط — لا تضاعف المشكلة.
- SharedPreferences للدفتر Flutter غير مناسب لمحتوى ضخم — لا توسّعه كقاعدة بيانات كاملة دون تصميم.

---

## 13) قواعد الأمان

- مدّل: موقع دقيق معلن في Privacy Manifest — لا توسّع لـ Always دون طلب.
- رواية API: لا تضع `change-me` secrets في إنتاج؛ لا تضعف JWT/argon2.
- Flutter: لا تخزّن توكنات في plain SharedPreferences عند إضافة Auth حقيقي.
- لا تسجّل PII أو أسرار في Logs.

---

## 14) قواعد تجربة المستخدم

- حافظ على التدفقات الحالية (SplitView لمدّل؛ NavigationStack لموروث؛ go_router لFlutter).
- لا تغيّر نصوص/ألوان/تخطيط إلا بطلب أو لإصلاح خلل واضح.
- RTL لواجهات التراث؛ دعم Dynamic Type حيث يسهل دون إعادة تصميم.

---

## 15) قواعد البناء

| منتج | البناء |
| --- | --- |
| مدّل | Scheme `OfflineNavigator`، iOS 17+ |
| موروث | Scheme `Riwaya`، iOS 17+ |
| رواية Flutter | `Runner.xcworkspace` / Scheme `Runner`، Deploy 13.0؛ سكربتات `ci_scripts/` و`rawayah/apps/mobile/ios/ci_scripts/` |

لا ترفع MARKETING_VERSION / Bundle ID / Team دون طلب.

---

## 16) قواعد الإصدار

- مدّل: وثّق التناقض الحالي README يقول 1.1 بينما `MARKETING_VERSION=1.0` — لا «تصلح» الإصدار عرضًا.
- رواية التراث: اتبع [docs/RAWAYA_XCODE_CLOUD.md](docs/RAWAYA_XCODE_CLOUD.md) وASC App `6797734164`.
- لا Submit للمراجعة / TestFlight من الوكيل ما لم تتوفر أدوات Apple ويُطلب صراحة.

---

## 17) المهام المستقبلية

1. حدّد المنتج.
2. اقرأ القسم المناسب في `docs/`.
3. افحص Git status.
4. نفّذ أصغر Diff.
5. اختبر ما هو متاح.
6. قدّم تقريرًا بالصيغة في البروتوكول المعتمد للمهمة (إن وُجد) أو ملخصًا يغطي: التغيير، الملفات، الاختبارات، المخاطر، ما لم يُتحقق منه.

---

## خريطة الوثائق

| وثيقة | المحتوى |
| --- | --- |
| [docs/README.md](docs/README.md) | فهرس الوثائق |
| [docs/architecture.md](docs/architecture.md) | المعمارية الفعلية للمنتجات الثلاثة |
| [docs/project-structure.md](docs/project-structure.md) | هيكل الملفات |
| [docs/coding-standards.md](docs/coding-standards.md) | معايير عامة للمستودع |
| [docs/swift-style.md](docs/swift-style.md) | أسلوب Swift في مدّل وموروث |
| [docs/swiftui-guidelines.md](docs/swiftui-guidelines.md) | إرشادات SwiftUI لهذا الكود |
| [docs/testing-strategy.md](docs/testing-strategy.md) | استراتيجية الاختبارات الموجودة |
| [docs/performance.md](docs/performance.md) | أداء حسب مسارات حقيقية |
| [docs/security.md](docs/security.md) | أمان وخصوصية |
| [docs/networking.md](docs/networking.md) | الشبكات (وما هو غير موجود) |
| [docs/data-persistence.md](docs/data-persistence.md) | Core Data / Prisma / SharedPreferences / KVS |
| [docs/error-handling.md](docs/error-handling.md) | أنماط الأخطاء الحالية |
| [docs/accessibility.md](docs/accessibility.md) | إمكانية الوصول |
| [docs/ui-guidelines.md](docs/ui-guidelines.md) | واجهات حسب المنتج |
| [docs/release-process.md](docs/release-process.md) | البناء والإصدار |
| [docs/app-store-readiness.md](docs/app-store-readiness.md) | جاهزية المتجر |
| [docs/maintenance.md](docs/maintenance.md) | الصيانة والديون المعروفة |
| [docs/rawayah-platform.md](docs/rawayah-platform.md) | منصة Nest/Next/Flutter |
| [docs/RAWAYA_XCODE_CLOUD.md](docs/RAWAYA_XCODE_CLOUD.md) | Xcode Cloud لرواية التراث |
| [docs/RAWAYA_MERGE.md](docs/RAWAYA_MERGE.md) | سجل دمج Codex |

صفحات الدعم العامة للمستخدم النهائي تبقى تحت `docs/index.html` و`docs/riwaya/` — ليست دليلًا هندسيًا للوكلاء.
