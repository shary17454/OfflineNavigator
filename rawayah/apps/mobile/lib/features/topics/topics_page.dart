import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class TopicsPage extends StatelessWidget {
  const TopicsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'الموضوعات',
      endpoint: '/topics',
      emptyMessage: 'لا توجد موضوعات منشورة بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const Icon(Icons.topic_outlined),
        title: Text(item['title']?.toString() ?? ''),
        onTap: () => context.push('/topics/${item['id']}'),
      ),
    );
  }
}
