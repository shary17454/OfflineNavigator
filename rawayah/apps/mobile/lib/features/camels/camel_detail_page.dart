import 'package:flutter/material.dart';

import '../../core/detail_page.dart';
import '../../core/theme.dart';

class CamelDetailPage extends StatelessWidget {
  const CamelDetailPage({super.key, required this.camelId});

  final String camelId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'الإبل',
      endpoint: '/camels/$camelId',
      builder: (context, camel) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(camel['name']?.toString() ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: kBrown)),
            const SizedBox(height: 12),
            if (camel['summary'] != null) Text(camel['summary'].toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
            if (camel['description'] != null) Text(camel['description'].toString(), style: const TextStyle(height: 1.8)),
          ],
        );
      },
    );
  }
}
