import 'package:flutter_test/flutter_test.dart';

import 'package:ask_me/main.dart';

void main() {
  testWidgets('App renders search screen with app bar title', (WidgetTester tester) async {
    await tester.pumpWidget(const AskMeApp());
    await tester.pump();

    expect(find.text('Ask.me'), findsOneWidget);
  });
}
