import 'package:flutter/material.dart';

import 'api_client.dart';
import 'theme.dart';

/// إطار عام لشاشة تفاصيل: يجلب سجلاً واحدًا من نقطة GET، ويعرض حالات
/// التحميل/الخطأ/النجاح، ويُمرِّر البيانات لـ[builder] عند النجاح.
class DetailPage extends StatefulWidget {
  const DetailPage({
    super.key,
    required this.title,
    required this.endpoint,
    required this.builder,
    this.actions,
  });

  final String title;
  final String endpoint;
  final Widget Function(BuildContext context, Map<String, dynamic> data) builder;
  final List<Widget>? actions;

  @override
  State<DetailPage> createState() => _DetailPageState();
}

class _DetailPageState extends State<DetailPage> {
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
      final res = await ApiClient().get<Map<String, dynamic>>(widget.endpoint);
      setState(() => _data = res.data);
    } catch (_) {
      setState(() => _error = 'تعذّر تحميل هذا العنصر');
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
        appBar: AppBar(title: Text(widget.title), actions: widget.actions),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text(_error!))
                : _data == null
                    ? const Center(child: Text('لا توجد بيانات'))
                    : widget.builder(context, _data!),
      ),
    );
  }
}
