import 'package:flutter/material.dart';

import '../offline/offline_models.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _controller = TextEditingController();
  final _store = OfflineLibraryStore();
  List<String> _results = const [];
  bool _loading = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _search(String value) async {
    final query = value.trim();
    if (query.isEmpty) {
      setState(() => _results = const []);
      return;
    }
    setState(() => _loading = true);
    final works = await _store.loadWorks();
    final results = works
        .where((work) {
          final searchableText = [
            work.title,
            work.authorName,
            work.genre,
            work.synopsis,
            ...work.chapters.expand((chapter) => [chapter.title, chapter.body]),
          ].join(' ');
          return searchableText.contains(query);
        })
        .map((work) => work.title)
        .toList();
    if (!mounted) return;
    setState(() {
      _results = results;
      _loading = false;
    });
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
              if (!_loading &&
                  _controller.text.trim().isNotEmpty &&
                  _results.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Text('لا توجد نتائج في دفترك المحلي'),
                ),
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
