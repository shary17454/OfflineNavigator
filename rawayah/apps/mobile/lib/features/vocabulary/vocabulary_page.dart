import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class VocabularyPage extends StatelessWidget {
  const VocabularyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'المفردات التراثية',
      endpoint: '/vocabulary',
      emptyMessage: 'لا توجد مفردات منشورة بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const Icon(Icons.translate),
        title: Text(item['term']?.toString() ?? ''),
        subtitle: Text(item['meaning']?.toString() ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
        onTap: () => context.push('/vocabulary/${item['id']}'),
      ),
    );
  }
}
