import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PlaceholderPage extends StatelessWidget {
  final String title;

  const PlaceholderPage({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const Text('هذه الشاشة ضمن بنية MVP الأولى، وتُفصل الآن كمكون احتياطي جاهز للتطوير.'),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () => context.go('/home'),
              child: const Text('الرجوع للرئيسية'),
            ),
          ],
        ),
      ),
    );
  }
}
