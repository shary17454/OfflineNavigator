import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:rawaya_mobile/main.dart';

const _captureKey = ValueKey('store-screenshot-boundary');

Future<void> _saveScreenshot(
  WidgetTester tester, {
  required String path,
}) async {
  await tester.pump();
  await expectLater(find.byKey(_captureKey), matchesGoldenFile(path));
}

Future<void> _pumpApp(WidgetTester tester) async {
  await tester.pumpWidget(
    RepaintBoundary(
      key: _captureKey,
      child: ProviderScope(key: UniqueKey(), child: const RawayaApp()),
    ),
  );
  await tester.pump(const Duration(seconds: 1));
  await tester.pump(const Duration(seconds: 1));
}

Future<void> _captureDevice(
  WidgetTester tester, {
  required Size logicalSize,
  required double pixelRatio,
  required String outputDirectory,
}) async {
  tester.view.physicalSize = logicalSize * pixelRatio;
  tester.view.devicePixelRatio = pixelRatio;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  // ignore: invalid_use_of_visible_for_testing_member
  SharedPreferences.setMockInitialValues({});
  await _pumpApp(tester);
  await _saveScreenshot(
    tester,
    path: '$outputDirectory/01-home.png',
  );

  await tester.tap(find.byType(TextField).first);
  await tester.pump(const Duration(seconds: 1));
  await tester.enterText(find.byType(TextField), 'راشد');
  await tester.testTextInput.receiveAction(TextInputAction.done);
  await tester.pump(const Duration(seconds: 1));
  await _saveScreenshot(
    tester,
    path: '$outputDirectory/05-search.png',
  );

  await _pumpApp(tester);
  await tester.tap(find.text('دفتر دون اتصال'));
  await tester.pump(const Duration(seconds: 1));
  await _saveScreenshot(
    tester,
    path: '$outputDirectory/02-library.png',
  );

  await tester.tap(find.text('ظل على الرمال'));
  await tester.pump(const Duration(seconds: 1));
  await _saveScreenshot(
    tester,
    path: '$outputDirectory/03-work.png',
  );

  await tester.tap(find.text('الخريطة'));
  await tester.pump(const Duration(seconds: 1));
  await _saveScreenshot(
    tester,
    path: '$outputDirectory/04-chapter.png',
  );
}

void main() {
  setUpAll(() async {
    final fontLoader = FontLoader('Tajawal')
      ..addFont(rootBundle.load('assets/fonts/Tajawal-Regular.ttf'))
      ..addFont(rootBundle.load('assets/fonts/Tajawal-Bold.ttf'));
    await fontLoader.load();
  });

  testWidgets('generate iPhone 6.9-inch App Store screenshots', (tester) async {
    await _captureDevice(
      tester,
      logicalSize: const Size(440, 956),
      pixelRatio: 3,
      outputDirectory: '../store_assets/iphone-6.9',
    );
  });

  testWidgets('generate iPad 13-inch App Store screenshots', (tester) async {
    await _captureDevice(
      tester,
      logicalSize: const Size(1032, 1376),
      pixelRatio: 2,
      outputDirectory: '../store_assets/ipad-13',
    );
  });
}
