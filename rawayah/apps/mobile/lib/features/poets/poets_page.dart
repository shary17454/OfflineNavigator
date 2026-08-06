import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class PoetsPage extends StatelessWidget {
  const PoetsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'الشعراء',
      endpoint: '/poets',
      emptyMessage: 'لا يوجد شعراء منشورون بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const CircleAvatar(child: Icon(Icons.person_outline)),
        title: Text(item['fullName']?.toString() ?? ''),
        subtitle: Text(item['region']?.toString() ?? ''),
        onTap: () => context.push('/poets/${item['id']}'),
      ),
    );
  }
}
