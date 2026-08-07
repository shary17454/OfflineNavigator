import 'package:flutter/material.dart';

import 'api_client.dart';
import 'theme.dart';

/// شاشة قائمة عامة قابلة لإعادة الاستخدام: تجلب قائمة من نقطة GET واحدة،
/// تدعم بحثًا نصيًا بسيطًا، وتُنشئ عنصر عرض لكل سجل عبر [itemBuilder].
class SimpleListPage extends StatefulWidget {
  const SimpleListPage({
    super.key,
    required this.title,
    required this.endpoint,
    required this.itemBuilder,
    this.emptyMessage = 'لا توجد نتائج بعد',
  });

  final String title;
  final String endpoint;
  final Widget Function(BuildContext context, Map<String, dynamic> item) itemBuilder;
  final String emptyMessage;

  @override
  State<SimpleListPage> createState() => _SimpleListPageState();
}

class _SimpleListPageState extends State<SimpleListPage> {
  final _controller = TextEditingController();
  List<Map<String, dynamic>> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load([String? q]) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final query = (q ?? '').trim();
      final path = query.isEmpty ? widget.endpoint : '${widget.endpoint}?q=$query';
      final res = await ApiClient().get<List<dynamic>>(path);
      _items = (res.data ?? []).cast<Map<String, dynamic>>();
    } catch (_) {
      _error = 'تعذّر الاتصال بالخادم';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.rawaya;
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.title),
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(9),
            child: Padding(padding: EdgeInsets.only(bottom: 8), child: RawayaGoldDivider()),
          ),
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
              child: TextField(
                controller: _controller,
                onSubmitted: _load,
                style: TextStyle(color: c.textPrimary),
                decoration: InputDecoration(
                  hintText: 'بحث في ${widget.title}',
                  prefixIcon: Icon(Icons.search, color: c.textSecondary),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide(color: c.border)),
                ),
              ),
            ),
            if (_loading) LinearProgressIndicator(color: c.gold, backgroundColor: c.surfaceAlt),
            if (_error != null)
              Padding(padding: const EdgeInsets.all(16), child: Text(_error!, style: TextStyle(color: c.danger))),
            if (!_loading && _items.isEmpty && _error == null)
              Padding(
                padding: const EdgeInsets.all(32),
                child: Text(widget.emptyMessage, style: TextStyle(color: c.textSecondary)),
              ),
            Expanded(
              child: RefreshIndicator(
                color: c.gold,
                onRefresh: () => _load(_controller.text),
                child: ListView.builder(
                  itemCount: _items.length,
                  itemBuilder: (context, index) => widget.itemBuilder(context, _items[index]),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
