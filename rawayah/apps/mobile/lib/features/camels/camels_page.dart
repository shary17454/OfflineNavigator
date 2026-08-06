import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class CamelsPage extends StatelessWidget {
  const CamelsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'الإبل',
      endpoint: '/camels',
      emptyMessage: 'لا توجد سلالات إبل منشورة بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const Icon(Icons.pets_outlined),
        title: Text(item['name']?.toString() ?? ''),
        onTap: () => context.push('/camels/${item['id']}'),
      ),
    );
  }
}
