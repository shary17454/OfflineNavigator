import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';

class PlacesPage extends StatelessWidget {
  const PlacesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleListPage(
      title: 'الأماكن والمعالم',
      endpoint: '/places',
      emptyMessage: 'لا توجد أماكن منشورة بعد',
      itemBuilder: (context, item) => ListTile(
        leading: const Icon(Icons.location_on_outlined),
        title: Text(item['name']?.toString() ?? ''),
        onTap: () => context.push('/places/${item['id']}'),
      ),
    );
  }
}
