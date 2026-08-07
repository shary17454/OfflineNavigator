import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

/// متابعة المساهم لحالة مراجعة موادّه — متطلب صريح بأن يرى حالة المراجعة
/// ويستطيع الرد على طلب التعديل.
class MyContributionsPage extends StatefulWidget {
  const MyContributionsPage({super.key});

  @override
  State<MyContributionsPage> createState() => _MyContributionsPageState();
}

class _MyContributionsPageState extends State<MyContributionsPage> {
  List<Map<String, dynamic>> _items = const [];
  bool _loading = true;
  bool _notContributor = false;

  static const _stateLabels = {
    'DRAFT': 'مسودة',
    'SUBMITTED': 'قيد الانتظار',
    'OWNER_REVIEW': 'قيد مراجعة المالك',
    'CHANGES_REQUESTED': 'مطلوب تعديل',
    'APPROVED': 'معتمدة — بانتظار النشر',
    'PUBLISHED': 'منشورة',
    'REJECTED': 'مرفوضة',
  };

  static const _stateColors = {
    'DRAFT': Colors.grey,
    'SUBMITTED': Colors.blue,
    'OWNER_REVIEW': Colors.blue,
    'CHANGES_REQUESTED': Colors.orange,
    'APPROVED': Colors.teal,
    'PUBLISHED': Colors.green,
    'REJECTED': Colors.red,
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get<List<dynamic>>('/poetry/my-contributions');
      _items = (res.data ?? []).cast<Map<String, dynamic>>();
      _notContributor = false;
    } catch (_) {
      _notContributor = true;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitForReview(String itemId) async {
    try {
      await ApiClient().post('/poetry/items/$itemId/submit');
      _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تعذّر إرسال المادة للمراجعة')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.rawaya.background,
        appBar: AppBar(title: const Text('مساهماتي')),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _notContributor
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'هذه الصفحة للرواة والمؤرخين المعتمدين.',
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          FilledButton(
                            style: FilledButton.styleFrom(backgroundColor: context.rawaya.gold),
                            onPressed: () => context.push('/contributors/apply'),
                            child: const Text('تقديم طلب عضوية'),
                          ),
                        ],
                      ),
                    ),
                  )
                : _items.isEmpty
                    ? const Center(child: Text('لم تضف أي مادة بعد'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          itemCount: _items.length,
                          itemBuilder: (context, index) {
                            final item = _items[index];
                            final state = item['reviewState']?.toString() ?? 'DRAFT';
                            final poet = ((item['poetFile'] as Map?)?['poet'] as Map?)?['fullName'];
                            final canSubmit = state == 'DRAFT' || state == 'CHANGES_REQUESTED';

                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              child: ListTile(
                                title: Text(item['title']?.toString() ?? ''),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (poet != null) Text('الشاعر: $poet'),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: (_stateColors[state] ?? Colors.grey).withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            _stateLabels[state] ?? state,
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: _stateColors[state] ?? Colors.grey,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (item['reviewNotes'] != null)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 6),
                                        child: Text(
                                          'ملاحظة المراجعة: ${item['reviewNotes']}',
                                          style: TextStyle(fontSize: 12, color: context.rawaya.textSecondary),
                                        ),
                                      ),
                                  ],
                                ),
                                isThreeLine: true,
                                trailing: canSubmit
                                    ? TextButton(
                                        onPressed: () => _submitForReview(item['id'].toString()),
                                        child: const Text('إرسال للمراجعة'),
                                      )
                                    : null,
                              ),
                            );
                          },
                        ),
                      ),
      ),
    );
  }
}
