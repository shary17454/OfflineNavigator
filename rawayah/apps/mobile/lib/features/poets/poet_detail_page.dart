import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/detail_page.dart';
import '../../core/theme.dart';

class PoetDetailPage extends StatelessWidget {
  const PoetDetailPage({super.key, required this.poetId});

  final String poetId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'الشاعر',
      endpoint: '/poets/$poetId',
      builder: (context, poet) {
        final poems = (poet['poems'] as List? ?? []).cast<Map<String, dynamic>>();
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(poet['fullName']?.toString() ?? '', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
            if (poet['knownAs'] != null) Text('يُعرف بـ: ${poet['knownAs']}'),
            const SizedBox(height: 8),
            if (poet['era'] != null) Text('العصر: ${poet['era']}'),
            if (poet['region'] != null) Text('المنطقة: ${poet['region']}'),
            const SizedBox(height: 12),
            if (poet['biography'] != null) Text(poet['biography'].toString()),
            const SizedBox(height: 16),
            // مدخل مكتبة الشاعر: تجمع كل المواد المرتبطة به بكل أشكالها.
            FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: context.rawaya.gold),
              onPressed: () => context.push('/poets/$poetId/library'),
              icon: const Icon(Icons.folder_special_outlined),
              label: const Text('مكتبة الشاعر'),
            ),
            const SizedBox(height: 20),
            Text('قصائد الشاعر', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
            const SizedBox(height: 8),
            ...poems.map(
              (poem) => Card(
                child: ListTile(
                  title: Text(poem['title']?.toString() ?? ''),
                  onTap: () => context.push('/poems/${poem['id']}'),
                ),
              ),
            ),
            if (poems.isEmpty) const Text('لا توجد قصائد منشورة لهذا الشاعر بعد'),
          ],
        );
      },
    );
  }
}
