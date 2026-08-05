import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:rawaya_mobile/main.dart';

void main() {
  testWidgets('Rawaya app renders splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: RawayaApp()));

    expect(find.text('موروث… ذاكرة التراث العربي'), findsOneWidget);
  });
}
