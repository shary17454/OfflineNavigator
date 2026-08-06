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
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: kCream,
        appBar: AppBar(title: Text(widget.title)),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: TextField(
                controller: _controller,
                onSubmitted: _load,
                decoration: InputDecoration(
                  hintText: 'بحث في ${widget.title}',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
            ),
            if (_loading) const LinearProgressIndicator(),
            if (_error != null) Padding(padding: const EdgeInsets.all(16), child: Text(_error!)),
            if (!_loading && _items.isEmpty && _error == null)
              Padding(padding: const EdgeInsets.all(32), child: Text(widget.emptyMessage)),
            Expanded(
              child: RefreshIndicator(
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
