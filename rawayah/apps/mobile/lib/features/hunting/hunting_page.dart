import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class HuntingPage extends StatelessWidget {
  const HuntingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'الصقارة والقنص',
      endpoint: '/hunting',
      emptyMessage: 'لا يوجد محتوى منشور بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const Icon(Icons.pets_outlined),
        title: Text(item['name']?.toString() ?? ''),
        onTap: () => context.push('/hunting/${item['id']}'),
      ),
    );
  }
}
