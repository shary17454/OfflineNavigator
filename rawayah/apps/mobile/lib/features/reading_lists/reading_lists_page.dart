import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

class ReadingListsPage extends StatefulWidget {
  const ReadingListsPage({super.key});

  @override
  State<ReadingListsPage> createState() => _ReadingListsPageState();
}

class _ReadingListsPageState extends State<ReadingListsPage> {
  List<Map<String, dynamic>> _lists = const [];
  bool _loading = true;
  bool _needsLogin = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient().get<List<dynamic>>('/reading-lists');
      setState(() => _lists = (res.data ?? []).cast<Map<String, dynamic>>());
    } catch (_) {
      setState(() => _needsLogin = true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createList() async {
    final controller = TextEditingController();
    final title = await showDialog<String>(
      context: context,
      builder: (context) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: const Text('قائمة قراءة جديدة'),
          content: TextField(controller: controller, decoration: const InputDecoration(hintText: 'اسم القائمة')),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
            FilledButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('إنشاء')),
          ],
        ),
      ),
    );
    if (title == null || title.isEmpty) return;
    try {
      await ApiClient().post('/reading-lists', data: {'title': title});
      _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: kCream,
        appBar: AppBar(title: const Text('المكتبة')),
        floatingActionButton: _needsLogin
            ? null
            : FloatingActionButton(backgroundColor: kGold, onPressed: _createList, child: const Icon(Icons.add)),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _needsLogin
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('سجّل الدخول لإنشاء قوائم القراءة الخاصة بك'),
                        const SizedBox(height: 12),
                        FilledButton(onPressed: () => context.push('/login'), child: const Text('تسجيل الدخول')),
                      ],
                    ),
                  )
                : _lists.isEmpty
                    ? const Center(child: Text('لا توجد قوائم قراءة بعد — أنشئ أول قائمة لك'))
                    : ListView.builder(
                        itemCount: _lists.length,
                        itemBuilder: (context, index) {
                          final list = _lists[index];
                          final itemCount = (list['items'] as List? ?? []).length;
                          return ListTile(
                            leading: const Icon(Icons.menu_book_outlined),
                            title: Text(list['title']?.toString() ?? ''),
                            subtitle: Text('$itemCount عنصر'),
                          );
                        },
                      ),
      ),
    );
  }
}
