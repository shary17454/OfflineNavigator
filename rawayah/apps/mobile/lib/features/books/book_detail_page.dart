import 'package:flutter/material.dart';

import '../../core/detail_page.dart';
import '../../core/theme.dart';

class BookDetailPage extends StatelessWidget {
  const BookDetailPage({super.key, required this.bookId});

  final String bookId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'الكتاب',
      endpoint: '/books/$bookId',
      builder: (context, book) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(book['title']?.toString() ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: kBrown)),
            const SizedBox(height: 8),
            if (book['author'] != null) Text('المؤلف: ${book['author']}'),
            if (book['editor'] != null) Text('المحقق: ${book['editor']}'),
            if (book['publisher'] != null) Text('الناشر: ${book['publisher']}'),
            if (book['publishedYear'] != null) Text('سنة النشر: ${book['publishedYear']}'),
            if (book['edition'] != null) Text('الطبعة: ${book['edition']}'),
            const SizedBox(height: 12),
            if (book['summary'] != null) Text(book['summary'].toString(), style: const TextStyle(height: 1.8)),
          ],
        );
      },
    );
  }
}
