import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class StoriesPage extends StatelessWidget {
  const StoriesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'القصص',
      endpoint: '/stories',
      emptyMessage: 'لا توجد قصص منشورة بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const Icon(Icons.menu_book_outlined),
        title: Text(item['title']?.toString() ?? ''),
        subtitle: item['summary'] != null ? Text(item['summary'].toString(), maxLines: 2, overflow: TextOverflow.ellipsis) : null,
        onTap: () => context.push('/stories/${item['id']}'),
      ),
    );
  }
}
