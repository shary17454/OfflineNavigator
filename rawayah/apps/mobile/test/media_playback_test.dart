import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rawaya_mobile/core/media_playback.dart';
import 'package:rawaya_mobile/core/theme.dart';

/// اختبارات مشغّل الوسائط.
///
/// لا تُشغَّل هنا شبكة حقيقية — المقصود إثبات سلوكين يسهل كسرهما لاحقًا
/// دون أن يلاحظ أحد: أن المشغّل **لا يحمّل الصوت قبل أن يطلب المستخدم**،
/// وأن المادة غير المجازة حقوقها تُشرح للمستخدم بدل زر صامت لا يعمل.

Widget _wrap(Widget child, {Brightness brightness = Brightness.light}) {
  return MaterialApp(
    theme: brightness == Brightness.light ? rawayaLightTheme : rawayaDarkTheme,
    home: Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(body: child),
    ),
  );
}

void main() {
  group('formatDuration', () {
    test('يعرض شرطات عند غياب المدة بدل صفر مضلل', () {
      expect(formatDuration(null), '--:--');
    });

    test('يعرض دقائق وثوانٍ بخانتين', () {
      expect(formatDuration(const Duration(seconds: 5)), '00:05');
      expect(formatDuration(const Duration(minutes: 3, seconds: 7)), '03:07');
    });

    test('يضيف خانة الساعات للتسجيلات الطويلة فقط', () {
      expect(formatDuration(const Duration(minutes: 59, seconds: 59)), '59:59');
      expect(formatDuration(const Duration(hours: 1, minutes: 2, seconds: 3)), '1:02:03');
    });
  });

  testWidgets('المشغّل الصوتي يعرض زر تشغيل ولا يبدأ التحميل تلقائيًا', (tester) async {
    await tester.pumpWidget(_wrap(
      const RawayaAudioPlayer(url: 'https://example.invalid/audio.mp3', title: 'قصيدة'),
    ));
    await tester.pump();

    // زر التشغيل ظاهر ولا مؤشر تحميل — أي أن الشبكة لم تُستدعَ عند البناء.
    expect(find.byIcon(Icons.play_arrow), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsNothing);
    expect(find.byIcon(Icons.pause), findsNothing);
  });

  testWidgets('المشغّل يبدأ بمدة غير معروفة فلا يدّعي مدة صفرية', (tester) async {
    await tester.pumpWidget(_wrap(
      const RawayaAudioPlayer(url: 'https://example.invalid/audio.mp3'),
    ));
    await tester.pump();

    expect(find.text('--:--'), findsOneWidget);
  });

  testWidgets('المادة غير المجازة حقوقها تُشرح للمستخدم بنصّ صريح', (tester) async {
    await tester.pumpWidget(_wrap(const RawayaMediaUnavailableNote()));
    await tester.pump();

    expect(find.textContaining('لم تُجَز حقوقها'), findsOneWidget);
    expect(find.byIcon(Icons.error_outline), findsOneWidget);
  });

  testWidgets('ملاحظة عدم التوفر تعمل في الوضع الليلي أيضًا', (tester) async {
    await tester.pumpWidget(_wrap(const RawayaMediaUnavailableNote(), brightness: Brightness.dark));
    await tester.pump();

    expect(find.textContaining('لم تُجَز حقوقها'), findsOneWidget);
  });
}
