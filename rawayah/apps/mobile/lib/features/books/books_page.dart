import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class BooksPage extends StatelessWidget {
  const BooksPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'الكتب والمراجع',
      endpoint: '/books',
      emptyMessage: 'لا توجد كتب منشورة بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const Icon(Icons.library_books_outlined),
        title: Text(item['title']?.toString() ?? ''),
        subtitle: Text(item['author']?.toString() ?? ''),
        onTap: () => context.push('/books/${item['id']}'),
      ),
    );
  }
}
