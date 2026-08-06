import 'package:flutter/material.dart';

import '../../core/detail_page.dart';
import '../../core/theme.dart';

class HuntingDetailPage extends StatelessWidget {
  const HuntingDetailPage({super.key, required this.itemId});

  final String itemId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'الصقارة والقنص',
      endpoint: '/hunting/$itemId',
      builder: (context, item) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(item['name']?.toString() ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: kBrown)),
            const SizedBox(height: 12),
            if (item['summary'] != null) Text(item['summary'].toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
            if (item['description'] != null) Text(item['description'].toString(), style: const TextStyle(height: 1.8)),
          ],
        );
      },
    );
  }
}
