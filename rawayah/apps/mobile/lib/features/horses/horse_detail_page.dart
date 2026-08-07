import 'package:flutter/material.dart';

import '../../core/detail_page.dart';
import '../../core/theme.dart';

class HorseDetailPage extends StatelessWidget {
  const HorseDetailPage({super.key, required this.horseId});

  final String horseId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'الخيل',
      endpoint: '/horses/$horseId',
      builder: (context, horse) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(horse['name']?.toString() ?? '', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
            const SizedBox(height: 12),
            if (horse['summary'] != null) Text(horse['summary'].toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
            if (horse['description'] != null) Text(horse['description'].toString(), style: const TextStyle(height: 1.8)),
          ],
        );
      },
    );
  }
}
