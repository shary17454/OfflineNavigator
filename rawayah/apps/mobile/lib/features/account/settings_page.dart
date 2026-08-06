import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: kCream,
        appBar: AppBar(title: const Text('الإعدادات')),
        body: ListView(
          children: [
            ListTile(title: const Text('عن التطبيق'), trailing: const Icon(Icons.chevron_left), onTap: () => context.push('/about')),
            ListTile(title: const Text('سياسة الخصوصية'), trailing: const Icon(Icons.chevron_left), onTap: () => context.push('/privacy')),
            ListTile(title: const Text('شروط الاستخدام'), trailing: const Icon(Icons.chevron_left), onTap: () => context.push('/terms')),
            ListTile(title: const Text('تواصل معنا'), trailing: const Icon(Icons.chevron_left), onTap: () => context.push('/contact')),
          ],
        ),
      ),
    );
  }
}
