import 'package:flutter/material.dart';

import '../../core/detail_page.dart';
import '../../core/theme.dart';

class ProverbDetailPage extends StatelessWidget {
  const ProverbDetailPage({super.key, required this.proverbId});

  final String proverbId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'المثل',
      endpoint: '/proverbs/$proverbId',
      builder: (context, proverb) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(proverb['phrase']?.toString() ?? '', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
            const SizedBox(height: 12),
            Text(proverb['explanation']?.toString() ?? '', style: const TextStyle(height: 1.8)),
            if (proverb['story'] != null) ...[
              const SizedBox(height: 12),
              const Text('قصة المثل', style: TextStyle(fontWeight: FontWeight.bold)),
              Text(proverb['story'].toString()),
            ],
            if (proverb['region'] != null) Text('المنطقة: ${proverb['region']}'),
          ],
        );
      },
    );
  }
}
