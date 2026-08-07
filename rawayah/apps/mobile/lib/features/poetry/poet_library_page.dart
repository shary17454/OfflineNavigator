import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

/// مكتبة الشاعر: تبويبات تُبنى من استجابة الخادم، والتبويب الفارغ
/// لا يظهر إطلاقًا لأن الخادم نفسه لا يعيده.
class PoetLibraryPage extends StatefulWidget {
  const PoetLibraryPage({super.key, required this.poetId});

  final String poetId;

  @override
  State<PoetLibraryPage> createState() => _PoetLibraryPageState();
}

class _PoetLibraryPageState extends State<PoetLibraryPage> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient().get<Map<String, dynamic>>('/poets/${widget.poetId}/library');
      _data = res.data;
    } catch (_) {
      _error = 'تعذّر تحميل مكتبة الشاعر';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // عرض التاريخ مع دقته — لا يُعرض تاريخ ظني كأنه مؤكد.
  String? _formatDate(String? date, String? precision) {
    if (date == null || date.isEmpty) return null;
    switch (precision) {
      case 'APPROXIMATE':
        return 'نحو $date';
      case 'DECADE':
        return 'في عقد $date';
      case 'CENTURY':
        return 'القرن $date';
      case 'DISPUTED':
        return '$date (مختلف فيه)';
      case 'UNKNOWN':
        return '$date (غير مؤكد)';
      default:
        return date;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(backgroundColor: kCream, body: Center(child: CircularProgressIndicator())),
      );
    }
    if (_error != null || _data == null) {
      return Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          backgroundColor: kCream,
          appBar: AppBar(title: const Text('مكتبة الشاعر')),
          body: Center(child: Text(_error ?? 'الشاعر غير موجود')),
        ),
      );
    }

    final poet = (_data!['poet'] as Map).cast<String, dynamic>();
    final tabs = ((_data!['tabs'] as List?) ?? []).cast<Map<String, dynamic>>();

    return Directionality(
      textDirection: TextDirection.rtl,
      child: DefaultTabController(
        length: tabs.length,
        child: Scaffold(
          backgroundColor: kCream,
          appBar: AppBar(
            title: Text(poet['fullName']?.toString() ?? 'مكتبة الشاعر'),
            bottom: tabs.isEmpty
                ? null
                : TabBar(
                    isScrollable: true,
                    tabs: [for (final t in tabs) Tab(text: '${t['label']} (${t['count']})')],
                  ),
          ),
          body: tabs.isEmpty
              ? const Center(child: Text('لا توجد مواد منشورة لهذا الشاعر بعد'))
              : TabBarView(
                  children: [for (final t in tabs) _buildTab(t['key']?.toString() ?? '', poet)],
                ),
        ),
      ),
    );
  }

  Widget _buildTab(String key, Map<String, dynamic> poet) {
    switch (key) {
      case 'overview':
        return _overviewTab(poet);
      case 'poems':
        return _poemsTab();
      case 'audio':
        return _mediaTab('audios', Icons.headphones_outlined);
      case 'video':
        return _mediaTab('videos', Icons.videocam_outlined);
      case 'images':
        return _mediaTab('images', Icons.image_outlined);
      case 'documents':
        return _mediaTab('documents', Icons.description_outlined);
      case 'links':
        return _mediaTab('links', Icons.link_outlined);
      case 'stories':
        return _storiesTab();
      case 'sources':
        return _sourcesTab();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _overviewTab(Map<String, dynamic> poet) {
    final birth = _formatDate(poet['birthDate']?.toString(), poet['birthDatePrecision']?.toString());
    final death = _formatDate(poet['deathDate']?.toString(), poet['deathDatePrecision']?.toString());
    final variants = ((_data!['nameVariants'] as List?) ?? []).cast<Map<String, dynamic>>();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (poet['knownAs'] != null) _infoRow('الاسم المشهور', poet['knownAs'].toString()),
        if (poet['kunya'] != null) _infoRow('الكنية', poet['kunya'].toString()),
        if (poet['laqab'] != null) _infoRow('اللقب', poet['laqab'].toString()),
        if (birth != null) _infoRow('الميلاد', birth),
        if (death != null) _infoRow('الوفاة', death),
        if (poet['era'] != null) _infoRow('العصر', poet['era'].toString()),
        if (poet['region'] != null) _infoRow('المنطقة', poet['region'].toString()),
        if (variants.isNotEmpty)
          _infoRow('أسماء أخرى', variants.map((v) => v['name']?.toString() ?? '').join('، ')),

        // ملاحظة اختلاف المصادر تُعرض بوضوح لا تُخفى.
        if (poet['disputeNote'] != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF6E0),
              border: Border.all(color: kGold),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline, size: 18, color: kGold),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'اختلاف المصادر: ${poet['disputeNote']}',
                    style: const TextStyle(color: kBrown),
                  ),
                ),
              ],
            ),
          ),
        ],

        if (poet['biography'] != null) ...[
          const SizedBox(height: 20),
          const Text('السيرة', style: TextStyle(fontWeight: FontWeight.bold, color: kBrown)),
          const SizedBox(height: 8),
          Text(poet['biography'].toString(), style: const TextStyle(height: 1.8)),
        ],
        if (_data!['overview'] != null) ...[
          const SizedBox(height: 20),
          Text(_data!['overview'].toString(), style: const TextStyle(height: 1.8)),
        ],
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: const TextStyle(color: Colors.black54)),
          ),
          Expanded(child: Text(value, style: const TextStyle(color: kBrown))),
        ],
      ),
    );
  }

  Widget _poemsTab() {
    final poems = ((_data!['poems'] as List?) ?? []).cast<Map<String, dynamic>>();
    final texts = ((_data!['texts'] as List?) ?? []).cast<Map<String, dynamic>>();
    if (poems.isEmpty && texts.isEmpty) {
      return const Center(child: Text('لا توجد قصائد منشورة'));
    }
    return ListView(
      children: [
        for (final p in poems)
          ListTile(
            leading: const Icon(Icons.menu_book_outlined, color: kGold),
            title: Text(p['title']?.toString() ?? ''),
            subtitle: p['summary'] != null ? Text(p['summary'].toString()) : null,
            onTap: () => context.push('/poems/${p['id']}'),
          ),
        for (final t in texts) _itemTile(t, Icons.article_outlined),
      ],
    );
  }

  Widget _mediaTab(String key, IconData icon) {
    final items = ((_data![key] as List?) ?? []).cast<Map<String, dynamic>>();
    if (items.isEmpty) return const Center(child: Text('لا توجد مواد'));
    return ListView(children: [for (final i in items) _itemTile(i, icon)]);
  }

  // بطاقة المادة: تعرض النسبة والمصدر والترخيص — لا تُعرض المادة
  // بلا ذكر من أضافها ومن يملك حقوقها متى ما توفرت.
  Widget _itemTile(Map<String, dynamic> item, IconData icon) {
    final contributor =
        ((item['contributedBy'] as Map?)?['profile'] as Map?)?['displayName']?.toString();
    final subtitleParts = <String>[
      if (item['reciterName'] != null) 'الراوي: ${item['reciterName']}',
      if (item['occasion'] != null) 'المناسبة: ${item['occasion']}',
      if (contributor != null) 'أضافها: $contributor',
      if (item['rightsHolder'] != null) 'الحقوق: ${item['rightsHolder']}',
      if (item['licenseName'] != null) 'الترخيص: ${item['licenseName']}',
    ];

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: ListTile(
        leading: Icon(icon, color: kGold),
        title: Text(item['title']?.toString() ?? ''),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (item['description'] != null) Text(item['description'].toString()),
            if (item['bodyText'] != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(item['bodyText'].toString(), style: const TextStyle(height: 1.7)),
              ),
            if (subtitleParts.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  subtitleParts.join(' • '),
                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                ),
              ),
          ],
        ),
        isThreeLine: subtitleParts.isNotEmpty,
      ),
    );
  }

  Widget _storiesTab() {
    final stories = ((_data!['stories'] as List?) ?? []).cast<Map<String, dynamic>>();
    if (stories.isEmpty) return const Center(child: Text('لا توجد قصص'));
    return ListView.builder(
      itemCount: stories.length,
      itemBuilder: (context, i) => ListTile(
        leading: const Icon(Icons.auto_stories_outlined, color: kGold),
        title: Text(stories[i]['title']?.toString() ?? ''),
        onTap: () => context.push('/stories/${stories[i]['id']}'),
      ),
    );
  }

  Widget _sourcesTab() {
    final sources = ((_data!['sources'] as List?) ?? []).cast<Map<String, dynamic>>();
    if (sources.isEmpty) return const Center(child: Text('لا توجد مصادر مسجلة'));
    return ListView.builder(
      itemCount: sources.length,
      itemBuilder: (context, i) {
        final s = sources[i];
        return ListTile(
          leading: const Icon(Icons.library_books_outlined, color: kGold),
          title: Text(s['title']?.toString() ?? ''),
          subtitle: Text([
            if (s['author'] != null) s['author'].toString(),
            if (s['tier'] != null) 'مستوى المصدر: ${s['tier']}',
          ].join(' • ')),
        );
      },
    );
  }
}
