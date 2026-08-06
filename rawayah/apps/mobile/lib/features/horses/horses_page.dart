import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class HorsesPage extends StatelessWidget {
  const HorsesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'الخيل',
      endpoint: '/horses',
      emptyMessage: 'لا توجد سلالات خيل منشورة بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const Icon(Icons.pets_outlined),
        title: Text(item['name']?.toString() ?? ''),
        onTap: () => context.push('/horses/${item['id']}'),
      ),
    );
  }
}
