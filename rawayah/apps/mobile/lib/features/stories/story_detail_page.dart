import 'package:flutter/material.dart';

import '../../core/detail_page.dart';
import '../../core/theme.dart';

class StoryDetailPage extends StatelessWidget {
  const StoryDetailPage({super.key, required this.storyId});

  final String storyId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'القصة',
      endpoint: '/stories/$storyId',
      builder: (context, story) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(story['title']?.toString() ?? '', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
            const SizedBox(height: 8),
            if (story['narrator'] != null) Text('الراوي: ${story['narrator']}'),
            if (story['location'] != null) Text('المكان: ${story['location']}'),
            if (story['era'] != null) Text('العصر: ${story['era']}'),
            const SizedBox(height: 12),
            Text(story['body']?.toString() ?? '', style: const TextStyle(height: 1.8)),
          ],
        );
      },
    );
  }
}
