import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/simple_list_page.dart';
import '../../core/theme.dart';

class QuestionsPage extends StatelessWidget {
  const QuestionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        SimpleListPage(
          title: 'الأسئلة',
          endpoint: '/questions',
          emptyMessage: 'لا توجد أسئلة بعد — كن أول من يسأل',
          itemBuilder: (context, item) => ListTile(
            leading: const Icon(Icons.help_outline),
            title: Text(item['title']?.toString() ?? ''),
            subtitle: Text(item['category']?.toString() ?? ''),
            onTap: () => context.push('/questions/${item['id']}'),
          ),
        ),
        Positioned(
          bottom: 16,
          left: 16,
          child: FloatingActionButton(
            backgroundColor: kGold,
            onPressed: () => context.push('/questions/new'),
            child: const Icon(Icons.add),
          ),
        ),
      ],
    );
  }
}
