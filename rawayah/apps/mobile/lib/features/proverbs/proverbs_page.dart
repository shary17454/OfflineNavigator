import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class ProverbsPage extends StatelessWidget {
  const ProverbsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'الأمثال',
      endpoint: '/proverbs',
      emptyMessage: 'لا توجد أمثال منشورة بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const Icon(Icons.format_quote),
        title: Text(item['phrase']?.toString() ?? ''),
        onTap: () => context.push('/proverbs/${item['id']}'),
      ),
    );
  }
}
