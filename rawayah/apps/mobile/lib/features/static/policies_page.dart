import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

/// قائمة وثائق الشروط والسياسات — تُقرأ من الخادم لا من نص مكتوب في
/// التطبيق، حتى يسري تعديل المالك فورًا دون إصدار نسخة جديدة.
class PoliciesListPage extends StatefulWidget {
  const PoliciesListPage({super.key});

  @override
  State<PoliciesListPage> createState() => _PoliciesListPageState();
}

class _PoliciesListPageState extends State<PoliciesListPage> {
  List<Map<String, dynamic>> _docs = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient().get<List<dynamic>>('/policies');
      _docs = (res.data ?? []).cast<Map<String, dynamic>>();
    } catch (_) {
      _docs = const [];
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.rawaya.background,
        appBar: AppBar(title: const Text('الشروط والسياسات')),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _docs.isEmpty
                ? const Center(child: Text('تعذّر تحميل الوثائق'))
                : ListView.separated(
                    itemCount: _docs.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final doc = _docs[index];
                      return ListTile(
                        leading: Icon(Icons.description_outlined, color: context.rawaya.gold),
                        title: Text(doc['titleAr']?.toString() ?? ''),
                        subtitle: Text('الإصدار ${doc['version']}'),
                        trailing: const Icon(Icons.chevron_left),
                        onTap: () => context.push('/policies/${doc['code']}'),
                      );
                    },
                  ),
      ),
    );
  }
}

/// عرض وثيقة سياسة واحدة بنصها النافذ.
class PolicyDetailPage extends StatefulWidget {
  const PolicyDetailPage({super.key, required this.code});

  final String code;

  @override
  State<PolicyDetailPage> createState() => _PolicyDetailPageState();
}

class _PolicyDetailPageState extends State<PolicyDetailPage> {
  Map<String, dynamic>? _doc;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient().get<Map<String, dynamic>>('/policies/${widget.code}');
      _doc = res.data;
    } catch (_) {
      _doc = null;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.rawaya.background,
        appBar: AppBar(title: Text(_doc?['titleAr']?.toString() ?? 'وثيقة')),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _doc == null
                ? const Center(child: Text('تعذّر تحميل الوثيقة'))
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'الإصدار ${_doc!['version']}',
                        style: TextStyle(fontSize: 12, color: context.rawaya.textSecondary),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _doc!['bodyAr']?.toString() ?? '',
                        style: TextStyle(height: 1.9, color: context.rawaya.textPrimary),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
      ),
    );
  }
}
