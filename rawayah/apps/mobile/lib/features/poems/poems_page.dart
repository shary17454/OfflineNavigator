import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class PoemsPage extends StatelessWidget {
  const PoemsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'القصائد',
      endpoint: '/poems',
      emptyMessage: 'لا توجد قصائد منشورة بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const Icon(Icons.article_outlined),
        title: Text(item['title']?.toString() ?? ''),
        subtitle: Text((item['poet'] as Map?)?['fullName']?.toString() ?? ''),
        onTap: () => context.push('/poems/${item['id']}'),
      ),
    );
  }
}
