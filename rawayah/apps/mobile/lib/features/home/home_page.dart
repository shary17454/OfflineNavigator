import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late final Future<List<String>> _sections = _loadSections();

  Future<List<String>> _loadSections() async {
    try {
      final response = await ApiClient().get<Map<String, dynamic>>('/home');
      final items = response.data?['featuredSections'];
      if (items is List) return items.map((item) => item.toString()).toList();
    } catch (_) {
      return const ['الشعر', 'القصص', 'الكتب والمراجع', 'الخيل', 'الإبل', 'الصقارة'];
    }
    return const ['الشعر', 'القصص', 'الكتب والمراجع'];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('رواية التراث')),
      body: Directionality(
        textDirection: TextDirection.rtl,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'رواية… ذاكرة التراث العربي',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'منصة لحفظ وصون التراث: شعر، قصص، كتب، ومساهماتك المحلية دون اتصال.',
              style: TextStyle(fontSize: 15, height: 1.5),
            ),
            const SizedBox(height: 12),
            TextField(
              readOnly: true,
              onTap: () => context.go('/search'),
              decoration: const InputDecoration(
                hintText: 'ابحث في الشعر والقصص والمراجع',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: ListTile(
                leading: const Icon(Icons.menu_book_outlined),
                title: const Text('دفتر دون اتصال'),
                subtitle: const Text('اكتب واقرأ مساهماتك محليًا دون إنترنت'),
                trailing: const Icon(Icons.chevron_left),
                onTap: () => context.go('/offline'),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.info_outline),
                title: const Text('عن رواية التراث'),
                subtitle: const Text('الإصدار 0.1.0 — MVP'),
                onTap: () {
                  showAboutDialog(
                    context: context,
                    applicationName: 'رواية التراث',
                    applicationVersion: '0.1.0',
                    applicationLegalese: 'منصة رواية التراث العربي',
                    children: const [
                      SizedBox(height: 12),
                      Text(
                        'رواية التراث تجمع محتوى التراث مع دفتر محلي للمساهمات دون اتصال، استعدادًا للربط الكامل مع الخادم.',
                      ),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
            FutureBuilder<List<String>>(
              future: _sections,
              builder: (context, snapshot) {
                final sections = snapshot.data ?? const ['الشعر', 'القصص', 'الكتب'];
                return Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: sections
                      .map(
                        (section) => ActionChip(
                          label: Text(section),
                          onPressed: () => context.go('/search'),
                        ),
                      )
                      .toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
