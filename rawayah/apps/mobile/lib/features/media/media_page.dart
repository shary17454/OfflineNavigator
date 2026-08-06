import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

class MediaPage extends StatefulWidget {
  const MediaPage({super.key});

  @override
  State<MediaPage> createState() => _MediaPageState();
}

class _MediaPageState extends State<MediaPage> {
  List<Map<String, dynamic>> _audios = const [];
  List<Map<String, dynamic>> _videos = const [];
  bool _loading = true;
  bool _needsLogin = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient().get<Map<String, dynamic>>('/media');
      final data = res.data ?? {};
      setState(() {
        _audios = ((data['audios'] as List?) ?? []).cast<Map<String, dynamic>>();
        _videos = ((data['videos'] as List?) ?? []).cast<Map<String, dynamic>>();
      });
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
        appBar: AppBar(title: const Text('الوسائط')),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _needsLogin
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('سجّل الدخول لعرض الوسائط'),
                        const SizedBox(height: 12),
                        FilledButton(onPressed: () => context.push('/login'), child: const Text('تسجيل الدخول')),
                      ],
                    ),
                  )
                : (_audios.isEmpty && _videos.isEmpty)
                    ? const Center(child: Text('لا توجد مواد صوتية أو مرئية منشورة بعد'))
                    : ListView(
                        children: [
                          if (_audios.isNotEmpty) ...[
                            const Padding(
                              padding: EdgeInsets.all(16),
                              child: Text('التسجيلات الصوتية', style: TextStyle(fontWeight: FontWeight.bold, color: kBrown)),
                            ),
                            ..._audios.map(
                              (a) => ListTile(
                                leading: const Icon(Icons.headphones_outlined),
                                title: Text(a['title']?.toString() ?? ''),
                                subtitle: a['narrator'] != null ? Text('الراوي: ${a['narrator']}') : null,
                              ),
                            ),
                          ],
                          if (_videos.isNotEmpty) ...[
                            const Padding(
                              padding: EdgeInsets.all(16),
                              child: Text('المقاطع المرئية', style: TextStyle(fontWeight: FontWeight.bold, color: kBrown)),
                            ),
                            ..._videos.map(
                              (v) => ListTile(
                                leading: const Icon(Icons.videocam_outlined),
                                title: Text(v['title']?.toString() ?? ''),
                              ),
                            ),
                          ],
                        ],
                      ),
      ),
    );
  }
}
