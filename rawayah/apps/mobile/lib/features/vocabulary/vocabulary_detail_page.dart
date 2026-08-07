import 'package:flutter/material.dart';

import '../../core/detail_page.dart';
import '../../core/theme.dart';

class VocabularyDetailPage extends StatelessWidget {
  const VocabularyDetailPage({super.key, required this.termId});

  final String termId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'المفردة',
      endpoint: '/vocabulary/$termId',
      builder: (context, term) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(term['term']?.toString() ?? '', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
            if (term['pronunciation'] != null) Text('النطق: ${term['pronunciation']}'),
            const SizedBox(height: 12),
            Text(term['meaning']?.toString() ?? '', style: const TextStyle(height: 1.8)),
            if (term['example'] != null) ...[
              const SizedBox(height: 12),
              const Text('مثال', style: TextStyle(fontWeight: FontWeight.bold)),
              Text(term['example'].toString()),
            ],
            if (term['dialect'] != null) Text('اللهجة: ${term['dialect']}'),
          ],
        );
      },
    );
  }
}
