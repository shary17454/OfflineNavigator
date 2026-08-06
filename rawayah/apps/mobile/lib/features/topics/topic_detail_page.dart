import 'package:flutter/material.dart';

import '../../core/detail_page.dart';
import '../../core/theme.dart';

class TopicDetailPage extends StatelessWidget {
  const TopicDetailPage({super.key, required this.topicId});

  final String topicId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'الموضوع',
      endpoint: '/topics/$topicId',
      builder: (context, topic) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(topic['title']?.toString() ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: kBrown)),
            const SizedBox(height: 12),
            if (topic['summary'] != null) Text(topic['summary'].toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
            if (topic['body'] != null) Text(topic['body'].toString(), style: const TextStyle(height: 1.8)),
          ],
        );
      },
    );
  }
}
