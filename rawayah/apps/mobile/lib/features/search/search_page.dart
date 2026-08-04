import 'package:flutter/material.dart';

import '../../core/api_client.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _controller = TextEditingController();
  List<String> _results = const [];
  bool _loading = false;

  Future<void> _search(String value) async {
    setState(() => _loading = true);
    try {
      final response = await ApiClient().get<Map<String, dynamic>>('/search?query=$value');
      final data = response.data ?? {};
      final poems = (data['poems'] as List? ?? []).map((item) => item['title'].toString());
      final stories = (data['stories'] as List? ?? []).map((item) => item['title'].toString());
      final books = (data['books'] as List? ?? []).map((item) => item['title'].toString());
      _results = [...poems, ...stories, ...books];
    } catch (_) {
      _results = value.trim().isEmpty ? const [] : ['نتيجة تجريبية عن: $value'];
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('البحث')),
      body: Directionality(
        textDirection: TextDirection.rtl,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              TextField(
                controller: _controller,
                onSubmitted: _search,
                decoration: InputDecoration(
                  hintText: 'اكتب كلمة بحث',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: IconButton(
                    onPressed: () => _search(_controller.text),
                    icon: const Icon(Icons.arrow_forward),
                  ),
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              if (_loading) const LinearProgressIndicator(),
              Expanded(
                child: ListView.builder(
                  itemCount: _results.length,
                  itemBuilder: (context, index) => ListTile(
                    title: Text(_results[index]),
                    leading: const Icon(Icons.article_outlined),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
