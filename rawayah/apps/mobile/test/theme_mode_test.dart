import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:rawaya_mobile/core/theme.dart';
import 'package:rawaya_mobile/main.dart';

/// يثبت آليًا ما تعذّر إثباته بلمس حي على المحاكي في الجلسة السابقة:
/// أن اختيار المستخدم الصريح لوضع السمة يتجاوز فعليًا إعداد نظام
/// التشغيل — لا مجرد افتراض نظري لأن `ThemeMode.light` من إطار
/// Flutter نفسه. هذا اختبار انحدار دائم، أقوى من لقطة شاشة لأنه يبقى
/// يحمي من أي كسر مستقبلي في `ThemeModeController`.
void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('الوضع الافتراضي (system) يتبع نظام التشغيل فعليًا', (tester) async {
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.dark;
    addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);

    await tester.pumpWidget(const ProviderScope(child: RawayaApp()));
    await tester.pumpAndSettle();

    final context = tester.element(find.byType(Scaffold).first);
    expect(Theme.of(context).brightness, Brightness.dark);
    expect(context.rawaya.isDark, true);
  });

  testWidgets('تبديل النظام من ليلي إلى نهاري يُطبَّق دون تدخل يدوي (system مفعّل)', (tester) async {
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.dark;
    addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);

    await tester.pumpWidget(const ProviderScope(child: RawayaApp()));
    await tester.pumpAndSettle();
    expect(Theme.of(tester.element(find.byType(Scaffold).first)).brightness, Brightness.dark);

    // محاكاة تغيير المستخدم لإعداد الجهاز أثناء تشغيل التطبيق —
    // بلا أي تفاعل داخل التطبيق نفسه. يحتاج أكثر من إطار واحد ليستقر
    // بسبب جدولة إعادة البناء عبر Riverpod/GoRouter (لا فرق في التطبيق
    // الفعلي حيث الإطارات تتوالى باستمرار دون خطوات يدوية).
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.light;
    await tester.pumpAndSettle();

    expect(Theme.of(tester.element(find.byType(Scaffold).first)).brightness, Brightness.light);
  });

  testWidgets('الاختيار اليدوي الصريح (نهاري) يتجاوز نظام تشغيل مضبوط على ليلي', (tester) async {
    // نظام التشغيل ليلي — لو كانت الإعادة تعتمد على النظام فقط لبقي
    // التطبيق ليليًا مهما اختار المستخدم.
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.dark;
    addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);

    final container = ProviderContainer();
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(container: container, child: const RawayaApp()),
    );
    await tester.pumpAndSettle();

    // تأكيد أولي: قبل أي اختيار، يتبع النظام (ليلي).
    expect(Theme.of(tester.element(find.byType(Scaffold).first)).brightness, Brightness.dark);

    // المستخدم يفتح الإعدادات ويختار "نهاري" صراحة — هذا بالضبط ما تعذّر
    // إثباته باللمس الحي، فنستدعي المسار البرمجي نفسه الذي يستدعيه
    // RadioListTile.onChanged في settings_page.dart.
    await container.read(themeModeProvider.notifier).setMode(ThemeMode.light);
    await tester.pumpAndSettle();

    expect(Theme.of(tester.element(find.byType(Scaffold).first)).brightness, Brightness.light);
    expect(container.read(themeModeProvider), ThemeMode.light);

    // ويبقى نهاريًا حتى لو "تغيّر" النظام لاحقًا — لأن الاختيار الصريح
    // أقوى من متابعة النظام.
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.dark;
    await tester.pumpAndSettle();
    expect(Theme.of(tester.element(find.byType(Scaffold).first)).brightness, Brightness.light);
  });

  test('اختيار وضع السمة يُحفظ محليًا ويُستعاد بعد إعادة التشغيل', () async {
    // الجولة الأولى: يختار المستخدم "ليلي" صراحة ويُغلق التطبيق.
    final container1 = ProviderContainer();
    await container1.read(themeModeProvider.notifier).setMode(ThemeMode.dark);
    container1.dispose();

    // الجولة الثانية: تطبيق جديد (محاكاة إعادة فتح التطبيق) — يجب أن
    // يستعيد الاختيار المحفوظ (ليلي) من SharedPreferences فعليًا، لا أن
    // يبدأ من system افتراضيًا كأن شيئًا لم يُحفظ.
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString('rawaya_theme_mode'), 'dark');

    final container2 = ProviderContainer();
    addTearDown(container2.dispose);
    // انتظار اكتمال _restore() غير المتزامن داخل مُنشئ ThemeModeController.
    await container2.read(themeModeProvider.notifier).stream.first;

    expect(container2.read(themeModeProvider), ThemeMode.dark);
  });
}
