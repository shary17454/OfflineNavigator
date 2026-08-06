import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class HuntingDogsPage extends StatelessWidget {
  const HuntingDogsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'كلاب الصيد',
      endpoint: '/hunting-dogs',
      emptyMessage: 'لا توجد سلالات مسجَّلة بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const Icon(Icons.pets_outlined),
        title: Text(item['name']?.toString() ?? ''),
        subtitle: item['origin'] != null ? Text('الأصل: ${item['origin']}') : null,
        onTap: () => context.push('/hunting-dogs/${item['id']}'),
      ),
    );
  }
}
