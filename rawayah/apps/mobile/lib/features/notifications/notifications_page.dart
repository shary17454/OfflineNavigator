import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  List<Map<String, dynamic>> _items = const [];
  bool _loading = true;
  bool _needsLogin = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient().get<List<dynamic>>('/notifications');
      setState(() => _items = (res.data ?? []).cast<Map<String, dynamic>>());
    } catch (_) {
      setState(() => _needsLogin = true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markRead(String id, int index) async {
    try {
      await ApiClient().post('/notifications/$id/read');
      setState(() => _items[index] = {..._items[index], 'isRead': true});
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.rawaya.background,
        appBar: AppBar(title: const Text('الإشعارات')),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _needsLogin
                ? const Center(child: Text('سجّل الدخول لعرض إشعاراتك'))
                : _items.isEmpty
                    ? const Center(child: Text('لا توجد إشعارات بعد'))
                    : ListView.builder(
                        itemCount: _items.length,
                        itemBuilder: (context, index) {
                          final item = _items[index];
                          final isRead = item['isRead'] == true;
                          return ListTile(
                            leading: Icon(isRead ? Icons.notifications_none : Icons.notifications_active, color: isRead ? Colors.grey : context.rawaya.gold),
                            title: Text(item['title']?.toString() ?? ''),
                            subtitle: Text(item['message']?.toString() ?? ''),
                            onTap: isRead ? null : () => _markRead(item['id'].toString(), index),
                          );
                        },
                      ),
      ),
    );
  }
}
