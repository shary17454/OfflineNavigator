import 'package:flutter/material.dart';

import '../../core/detail_page.dart';
import '../../core/theme.dart';

class HuntingDogDetailPage extends StatelessWidget {
  const HuntingDogDetailPage({super.key, required this.breedId});

  final String breedId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'كلاب الصيد',
      endpoint: '/hunting-dogs/$breedId',
      builder: (context, breed) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(breed['name']?.toString() ?? '', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
            const SizedBox(height: 12),
            if (breed['origin'] != null) Text('الأصل: ${breed['origin']}'),
            if (breed['traits'] != null) Text('الصفات: ${breed['traits']}'),
            if (breed['usage'] != null) Text('الاستخدام: ${breed['usage']}'),
          ],
        );
      },
    );
  }
}
