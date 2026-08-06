import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

const _kTypeRoutes = {
  'POEM': '/poems',
  'STORY': '/stories',
  'BOOK': '/books',
  'POET': '/poets',
};

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key});

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  List<Map<String, dynamic>> _items = const [];
  bool _loading = true;
  bool _needsLogin = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get<List<dynamic>>('/favorites');
      setState(() => _items = (res.data ?? []).cast<Map<String, dynamic>>());
    } catch (_) {
      setState(() => _needsLogin = true);
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
        appBar: AppBar(title: const Text('المفضلة')),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _needsLogin
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('سجّل الدخول لعرض مفضلتك'),
                        const SizedBox(height: 12),
                        FilledButton(onPressed: () => context.push('/login'), child: const Text('تسجيل الدخول')),
                      ],
                    ),
                  )
                : _items.isEmpty
                    ? const Center(child: Text('لم تُضِف شيئًا للمفضلة بعد'))
                    : ListView.builder(
                        itemCount: _items.length,
                        itemBuilder: (context, index) {
                          final item = _items[index];
                          final route = _kTypeRoutes[item['contentType']];
                          return ListTile(
                            leading: const Icon(Icons.favorite, color: Colors.red),
                            title: Text(item['title']?.toString() ?? 'عنصر محذوف'),
                            onTap: route == null ? null : () => context.push('$route/${item['contentId']}'),
                          );
                        },
                      ),
      ),
    );
  }
}
