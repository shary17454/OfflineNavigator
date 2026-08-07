import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:just_audio/just_audio.dart';

import 'package:rawaya_mobile/core/api_client.dart';
import 'package:rawaya_mobile/core/media_playback.dart';

/// اختبار E2E حقيقي على جهاز/محاكي فعلي.
///
/// لا يُحاكي شيئًا: يسجّل الدخول إلى خادم API حي، يقرأ رابطًا موقَّعًا
/// حقيقيًا لتسجيل صوتي مخزَّن في MinIO، ثم يشغّله بمحرك الصوت الأصلي
/// لنظام iOS ويتأكد أن الموضع تقدّم فعلًا. اختبار الوِدجت وحده لا يثبت
/// هذا لأنه لا يملك محرك صوت أصلًا.
///
/// التشغيل:
///   flutter test integration_test/media_playback_e2e_test.dart \
///     -d <simulator-id> --dart-define=API_BASE_URL=http://localhost:4000/api
///
/// يتخطّى نفسه بوضوح إن لم يكن الخادم حيًّا، بدل أن يفشل فشلًا مضلّلًا
/// يوحي بعطب في التطبيق.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  const email = 'user@rawaya.test';
  const password = 'user1234';

  testWidgets('تسجيل صوتي حقيقي يُشغَّل فعليًا بمحرك الصوت الأصلي', (tester) async {
    final api = ApiClient();

    // ---- 1) دخول حقيقي إلى الخادم ----
    late String token;
    try {
      final login = await api.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      token = login.data?['accessToken']?.toString() ?? '';
    } catch (e) {
      markTestSkipped('الخادم غير متاح أو بيانات الدخول غير صالحة: $e');
      return;
    }
    expect(token, isNotEmpty, reason: 'الدخول لم يُصدر رمز وصول');

    // ApiClient يقرأ الرمز من التخزين الآمن في كل طلب، فحفظه هنا يجعل
    // بقية الاختبار يمر بنفس مسار التطبيق الحقيقي لا بمسار خاص بالاختبار.
    await ApiClient.saveTokens(accessToken: token);
    addTearDown(ApiClient.clearTokens);

    // ---- 2) قراءة رابط موقَّع حقيقي ----
    final media = await api.get<Map<String, dynamic>>('/media');
    final audios = ((media.data?['audios'] as List?) ?? []).cast<Map<String, dynamic>>();

    // التسجيل النصي الوهمي القديم (24 بايت) لا يصلح للتشغيل، فيُستبعد
    // صراحةً بدل ترك الاختبار يلتقطه عشوائيًا ويفشل بلا سبب مفهوم.
    final playable = audios.where((a) => (a['durationMs'] as int? ?? 0) > 0).toList();
    if (playable.isEmpty) {
      markTestSkipped('لا يوجد تسجيل صوتي حقيقي في القاعدة لإجراء الاختبار عليه');
      return;
    }

    final url = playable.first['fileUrl']?.toString();
    expect(url, isNotNull, reason: 'الخادم لم يُعِد رابطًا موقَّعًا');
    expect(url, startsWith('http'), reason: 'الرابط المُعاد مفتاح تخزين لا رابط قابل للفتح');

    // ---- 3) بناء المشغّل داخل شجرة ودجت حقيقية ----
    await tester.pumpWidget(
      MaterialApp(
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: Scaffold(body: RawayaAudioPlayer(url: url!, title: 'اختبار حي')),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.play_arrow), findsOneWidget, reason: 'زر التشغيل غير ظاهر');

    // ---- 4) التشغيل الفعلي ----
    await tester.tap(find.byIcon(Icons.play_arrow));
    await tester.pump();

    // مهلة كافية للتحميل عبر الشبكة ثم بدء التشغيل فعليًا.
    for (var i = 0; i < 60 && find.byIcon(Icons.pause).evaluate().isEmpty; i++) {
      await tester.pump(const Duration(milliseconds: 250));
    }

    expect(find.byIcon(Icons.pause), findsOneWidget,
        reason: 'المشغّل لم ينتقل إلى حالة التشغيل — الصوت لم يبدأ فعلًا');

    // ---- 5) إثبات أن الصوت يتقدّم لا أن الزر تغيّر شكله فقط ----
    await tester.pump(const Duration(seconds: 2));
    for (var i = 0; i < 12; i++) {
      await tester.pump(const Duration(milliseconds: 250));
    }

    final player = debugActiveAudioPlayer;
    expect(player, isNotNull, reason: 'لا يوجد مشغّل نشط رغم أن الواجهة تقول إنه يعمل');
    expect(player!.position.inMilliseconds, greaterThan(0),
        reason: 'موضع التشغيل لم يتقدّم — الصوت لا يعمل فعلًا');
    expect(player.duration, isNotNull, reason: 'لم تُقرأ مدة الملف — الترميز غير مدعوم أو الملف تالف');

    // ---- 6) الإيقاف يعمل ----
    await tester.tap(find.byIcon(Icons.pause));
    await tester.pumpAndSettle();
    expect(find.byIcon(Icons.play_arrow), findsOneWidget);
  });
}
