import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/detail_page.dart';
import '../../core/feedback_sheet.dart';
import '../../core/theme.dart';

class PoemDetailPage extends StatelessWidget {
  const PoemDetailPage({super.key, required this.poemId});

  final String poemId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'القصيدة',
      endpoint: '/poems/$poemId',
      actions: [
        IconButton(
          icon: const Icon(Icons.flag_outlined),
          tooltip: 'إبلاغ أو اقتراح',
          onPressed: () => showFeedbackSheet(context, contentType: 'POEM', contentId: poemId),
        ),
      ],
      builder: (context, poem) {
        final versions = (poem['versions'] as List? ?? []).cast<Map<String, dynamic>>();
        final attributions = (poem['attributions'] as List? ?? []).cast<Map<String, dynamic>>();
        final poet = poem['poet'] as Map<String, dynamic>?;

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(poem['title']?.toString() ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: kBrown)),
            if (poet != null)
              GestureDetector(
                onTap: () => context.push('/poets/${poet['id']}'),
                child: Text('للشاعر: ${poet['fullName']}', style: const TextStyle(color: kGold)),
              ),
            const SizedBox(height: 8),
            if (poem['occasion'] != null) Text('المناسبة: ${poem['occasion']}'),
            if (poem['meter'] != null) Text('البحر: ${poem['meter']}'),
            const SizedBox(height: 16),

            if (attributions.isNotEmpty) ...[
              const Text('حالة نسبة القصيدة', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kBrown)),
              const SizedBox(height: 6),
              ...attributions.map((a) {
                final disputed = a['consensus'] == 'DISPUTED';
                return Card(
                  color: disputed ? Colors.orange.shade50 : null,
                  child: ListTile(
                    leading: Icon(disputed ? Icons.help_outline : Icons.verified_outlined),
                    title: Text((a['poet'] as Map?)?['fullName']?.toString() ?? a['claimedName']?.toString() ?? 'غير معروف'),
                    subtitle: Text(disputed ? 'مختلف عليها بين الروايات' : 'متفق عليها'),
                  ),
                );
              }),
              const SizedBox(height: 16),
            ],

            const Text('روايات القصيدة', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: kBrown)),
            const SizedBox(height: 8),
            if (versions.isEmpty) const Text('لا توجد نسخة مُفصَّلة بأبيات بعد لهذه القصيدة — راجع النص العام أدناه إن وُجد.'),
            ...versions.map((version) => _VersionCard(version: version)),

            if (poem['body'] != null && (poem['body'] as String).isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text('النص العام', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: kBrown)),
              const SizedBox(height: 8),
              Text(poem['body'].toString(), style: const TextStyle(height: 1.8)),
            ],
          ],
        );
      },
    );
  }
}

class _VersionCard extends StatelessWidget {
  const _VersionCard({required this.version});

  final Map<String, dynamic> version;

  @override
  Widget build(BuildContext context) {
    final verses = (version['verses'] as List? ?? []).cast<Map<String, dynamic>>();
    final isPrimary = version['isPrimary'] == true;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(version['label']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                if (isPrimary) const Chip(label: Text('الرواية الأساسية'), visualDensity: VisualDensity.compact),
              ],
            ),
            if (version['sourceNotes'] != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text('المصدر: ${version['sourceNotes']}', style: const TextStyle(fontSize: 12, color: Colors.black54)),
              ),
            const SizedBox(height: 8),
            for (final verse in verses) _VerseTile(verse: verse),
            if (verses.isEmpty) const Text('لا توجد أبيات مُدخلة لهذه الرواية بعد'),
          ],
        ),
      ),
    );
  }
}

class _VerseTile extends StatelessWidget {
  const _VerseTile({required this.verse});

  final Map<String, dynamic> verse;

  @override
  Widget build(BuildContext context) {
    final variants = (verse['variants'] as List? ?? []).cast<Map<String, dynamic>>();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(verse['text']?.toString() ?? '', textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, height: 1.6)),
          if (verse['explanation'] != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text('الشرح: ${verse['explanation']}', style: const TextStyle(fontSize: 12, color: Colors.black54)),
            ),
          if (variants.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: variants
                    .map((v) => Text('رواية أخرى: ${v['text']}', style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic)))
                    .toList(),
              ),
            ),
          const Divider(),
        ],
      ),
    );
  }
}
