import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

/// أقسام الشعر — تُبنى بالكامل من تصنيفات الخادم، فلا يوجد أي نوع شعر
/// مكتوب في الواجهة. إضافة المالك لتصنيف جديد تظهر هنا دون تحديث التطبيق.
class PoetrySectionsPage extends StatefulWidget {
  const PoetrySectionsPage({super.key});

  @override
  State<PoetrySectionsPage> createState() => _PoetrySectionsPageState();
}

class _PoetrySectionsPageState extends State<PoetrySectionsPage> {
  Map<String, List<Map<String, dynamic>>> _dimensions = const {};
  bool _loading = true;
  String? _error;

  // عناوين الأبعاد بالعربية. البعد نفسه ثابت في نموذج البيانات،
  // أما التصنيفات داخله فديناميكية بالكامل.
  static const _dimensionLabels = {
    'TRADITION': 'حسب نوع الشعر',
    'ERA': 'حسب العصر',
    'THEME': 'حسب الغرض والموضوع',
    'REGION': 'حسب المنطقة',
    'PERFORMANCE': 'حسب طريقة الأداء',
    'COLLECTION': 'مجموعات',
  };

  static const _dimensionIcons = {
    'TRADITION': Icons.auto_stories_outlined,
    'ERA': Icons.history_edu_outlined,
    'THEME': Icons.local_offer_outlined,
    'REGION': Icons.place_outlined,
    'PERFORMANCE': Icons.mic_none_outlined,
    'COLLECTION': Icons.collections_bookmark_outlined,
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient().get<Map<String, dynamic>>('/poetry/taxonomy');
      final dims = (res.data?['dimensions'] as Map?) ?? {};
      _dimensions = dims.map(
        (key, value) => MapEntry(
          key.toString(),
          (value as List).cast<Map<String, dynamic>>(),
        ),
      );
    } catch (_) {
      _error = 'تعذّر تحميل أقسام الشعر';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // ترتيب ثابت للأبعاد حتى لا يتغير ترتيب الشاشة بين التحميلات.
    const order = ['TRADITION', 'ERA', 'THEME', 'PERFORMANCE', 'COLLECTION', 'REGION'];
    final present = order.where((d) => (_dimensions[d] ?? const []).isNotEmpty).toList();

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('الشعر'),
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(9),
            child: Padding(padding: EdgeInsets.only(bottom: 8), child: RawayaGoldDivider()),
          ),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!),
                        const SizedBox(height: 12),
                        FilledButton(onPressed: _load, child: const Text('إعادة المحاولة')),
                      ],
                    ),
                  )
                : present.isEmpty
                    ? const Center(child: Text('لا توجد أقسام شعر منشورة بعد'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView(
                          padding: const EdgeInsets.only(bottom: 24),
                          children: [
                            for (final dim in present) ...[
                              Padding(
                                padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                                child: Row(
                                  children: [
                                    Icon(_dimensionIcons[dim], size: 20, color: context.rawaya.gold),
                                    const SizedBox(width: 8),
                                    Text(
                                      _dimensionLabels[dim] ?? dim,
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: context.rawaya.textPrimary,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                child: Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    for (final term in _dimensions[dim]!)
                                      ActionChip(
                                        label: Text(term['nameAr']?.toString() ?? ''),
                                        onPressed: () => context.push('/poetry/${term['slug']}'),
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
      ),
    );
  }
}

/// قائمة القصائد ضمن تصنيف واحد.
class PoetryTermPage extends StatefulWidget {
  const PoetryTermPage({super.key, required this.slug});

  final String slug;

  @override
  State<PoetryTermPage> createState() => _PoetryTermPageState();
}

class _PoetryTermPageState extends State<PoetryTermPage> {
  Map<String, dynamic>? _term;
  List<Map<String, dynamic>> _poems = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient().get<Map<String, dynamic>>('/poetry/taxonomy/${widget.slug}/poems');
      _term = (res.data?['term'] as Map?)?.cast<String, dynamic>();
      _poems = ((res.data?['poems'] as List?) ?? []).cast<Map<String, dynamic>>();
    } catch (_) {
      _term = null;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text(_term?['nameAr']?.toString() ?? 'قصائد القسم'),
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(9),
            child: Padding(padding: EdgeInsets.only(bottom: 8), child: RawayaGoldDivider()),
          ),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _poems.isEmpty
                ? const Center(child: Text('لا توجد قصائد منشورة في هذا القسم بعد'))
                : ListView.builder(
                    itemCount: _poems.length,
                    itemBuilder: (context, index) {
                      final poem = _poems[index];
                      return ListTile(
                        leading: Icon(Icons.menu_book_outlined, color: context.rawaya.gold),
                        title: Text(poem['title']?.toString() ?? ''),
                        subtitle: poem['summary'] != null ? Text(poem['summary'].toString()) : null,
                        onTap: () => context.push('/poems/${poem['id']}'),
                      );
                    },
                  ),
      ),
    );
  }
}
