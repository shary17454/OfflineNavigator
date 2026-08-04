import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'offline_models.dart';

class OfflineLibraryPage extends StatefulWidget {
  const OfflineLibraryPage({super.key});

  @override
  State<OfflineLibraryPage> createState() => _OfflineLibraryPageState();
}

class _OfflineLibraryPageState extends State<OfflineLibraryPage> {
  final _store = OfflineLibraryStore();
  late Future<List<OfflineWork>> _worksFuture;

  @override
  void initState() {
    super.initState();
    _worksFuture = _store.loadWorks();
  }

  Future<void> _reload() async {
    setState(() {
      _worksFuture = _store.loadWorks();
    });
  }

  Future<void> _createWork() async {
    final works = await _store.loadWorks();
    final now = DateTime.now();
    final work = OfflineWork(
      id: 'work-${now.millisecondsSinceEpoch}',
      title: 'مساهمة جديدة',
      authorName: 'أنا',
      genre: 'قصة',
      synopsis: '',
      updatedAt: now,
      chapters: [
        OfflineChapter(
          id: 'ch-${now.millisecondsSinceEpoch}',
          title: 'الفصل 1',
          body: '',
          updatedAt: now,
        ),
      ],
    );
    works.insert(0, work);
    await _store.saveWorks(works);
    if (!mounted) return;
    await context.push('/offline/work/${work.id}');
    await _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('دفتر دون اتصال'),
        actions: [
          IconButton(
            onPressed: _createWork,
            icon: const Icon(Icons.add),
            tooltip: 'مساهمة جديدة',
          ),
        ],
      ),
      body: Directionality(
        textDirection: TextDirection.rtl,
        child: FutureBuilder<List<OfflineWork>>(
          future: _worksFuture,
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            final works = snapshot.data!;
            if (works.isEmpty) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('لا توجد مساهمات محلية بعد'),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _createWork,
                      child: const Text('ابدأ مساهمة'),
                    ),
                  ],
                ),
              );
            }
            return RefreshIndicator(
              onRefresh: _reload,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: works.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final work = works[index];
                  return Card(
                    child: ListTile(
                      title: Text(work.title),
                      subtitle: Text(
                        '${work.genre} · ${work.chapters.length} فصل · ${work.totalWordCount} كلمة',
                      ),
                      trailing: work.isFavorite
                          ? const Icon(Icons.star, color: Colors.amber)
                          : const Icon(Icons.chevron_left),
                      onTap: () async {
                        await context.push('/offline/work/${work.id}');
                        await _reload();
                      },
                    ),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

class OfflineWorkPage extends StatefulWidget {
  const OfflineWorkPage({super.key, required this.workId});

  final String workId;

  @override
  State<OfflineWorkPage> createState() => _OfflineWorkPageState();
}

class _OfflineWorkPageState extends State<OfflineWorkPage> {
  final _store = OfflineLibraryStore();
  final _titleController = TextEditingController();
  final _synopsisController = TextEditingController();
  OfflineWork? _work;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _synopsisController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final works = await _store.loadWorks();
    final work = works.where((item) => item.id == widget.workId).firstOrNull;
    if (!mounted) return;
    setState(() {
      _work = work;
      _loaded = true;
      if (work != null) {
        _titleController.text = work.title;
        _synopsisController.text = work.synopsis;
      }
    });
  }

  Future<void> _persist() async {
    final current = _work;
    if (current == null) return;
    current.title = _titleController.text.trim().isEmpty ? current.title : _titleController.text.trim();
    current.synopsis = _synopsisController.text.trim();
    current.updatedAt = DateTime.now();
    final works = await _store.loadWorks();
    final index = works.indexWhere((item) => item.id == current.id);
    if (index >= 0) {
      works[index] = current;
    } else {
      works.insert(0, current);
    }
    await _store.saveWorks(works);
    if (mounted) setState(() {});
  }

  Future<void> _addChapter() async {
    final current = _work;
    if (current == null) return;
    final now = DateTime.now();
    current.chapters.add(
      OfflineChapter(
        id: 'ch-${now.millisecondsSinceEpoch}',
        title: 'فصل ${current.chapters.length + 1}',
        body: '',
        updatedAt: now,
      ),
    );
    await _persist();
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final work = _work;
    if (work == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('المساهمة')),
        body: const Center(child: Text('المساهمة غير موجودة')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(work.title),
        actions: [
          IconButton(
            onPressed: () async {
              work.isFavorite = !work.isFavorite;
              await _persist();
            },
            icon: Icon(work.isFavorite ? Icons.star : Icons.star_border),
          ),
          IconButton(
            onPressed: _addChapter,
            icon: const Icon(Icons.playlist_add),
            tooltip: 'فصل جديد',
          ),
        ],
      ),
      body: Directionality(
        textDirection: TextDirection.rtl,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'العنوان'),
              onEditingComplete: _persist,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _synopsisController,
              decoration: const InputDecoration(labelText: 'نبذة'),
              maxLines: 3,
              onEditingComplete: _persist,
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: _persist,
                icon: const Icon(Icons.save),
                label: const Text('حفظ'),
              ),
            ),
            const SizedBox(height: 8),
            Text('الفصول · ${work.totalWordCount} كلمة'),
            const SizedBox(height: 8),
            ...work.chapters.map(
              (chapter) => Card(
                child: ListTile(
                  title: Text(chapter.title),
                  subtitle: Text('${chapter.wordCount} كلمة'),
                  onTap: () async {
                    await _persist();
                    if (!context.mounted) return;
                    await context.push('/offline/work/${work.id}/chapter/${chapter.id}');
                    await _load();
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OfflineChapterPage extends StatefulWidget {
  const OfflineChapterPage({
    super.key,
    required this.workId,
    required this.chapterId,
  });

  final String workId;
  final String chapterId;

  @override
  State<OfflineChapterPage> createState() => _OfflineChapterPageState();
}

class _OfflineChapterPageState extends State<OfflineChapterPage> {
  final _store = OfflineLibraryStore();
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  OfflineWork? _work;
  OfflineChapter? _chapter;
  bool _readerMode = false;
  double _fontSize = 20;
  bool _night = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final works = await _store.loadWorks();
    final work = works.where((item) => item.id == widget.workId).firstOrNull;
    final chapter = work?.chapters.where((item) => item.id == widget.chapterId).firstOrNull;
    if (!mounted) return;
    setState(() {
      _work = work;
      _chapter = chapter;
      if (chapter != null) {
        _titleController.text = chapter.title;
        _bodyController.text = chapter.body;
      }
    });
  }

  Future<void> _save() async {
    final work = _work;
    final chapter = _chapter;
    if (work == null || chapter == null) return;
    chapter.title =
        _titleController.text.trim().isEmpty ? chapter.title : _titleController.text.trim();
    chapter.body = _bodyController.text;
    chapter.updatedAt = DateTime.now();
    work.updatedAt = DateTime.now();
    final works = await _store.loadWorks();
    final index = works.indexWhere((item) => item.id == work.id);
    if (index >= 0) works[index] = work;
    await _store.saveWorks(works);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('تم الحفظ محليًا')),
    );
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final chapter = _chapter;
    if (chapter == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('الفصل')),
        body: const Center(child: Text('الفصل غير موجود')),
      );
    }

    final bg = _night ? const Color(0xFF0F1A1F) : const Color(0xFFFDF7ED);
    final fg = _night ? const Color(0xFFE8EEF0) : const Color(0xFF1A1510);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        title: Text(_readerMode ? 'قراءة' : 'تحرير'),
        actions: [
          IconButton(
            onPressed: () => setState(() => _readerMode = !_readerMode),
            icon: Icon(_readerMode ? Icons.edit : Icons.menu_book),
          ),
          IconButton(
            onPressed: _save,
            icon: const Icon(Icons.save),
          ),
        ],
      ),
      body: Directionality(
        textDirection: TextDirection.rtl,
        child: _readerMode
            ? ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Row(
                    children: [
                      Text('حجم الخط', style: TextStyle(color: fg)),
                      Expanded(
                        child: Slider(
                          value: _fontSize,
                          min: 14,
                          max: 34,
                          onChanged: (value) => setState(() => _fontSize = value),
                        ),
                      ),
                      IconButton(
                        onPressed: () => setState(() => _night = !_night),
                        icon: Icon(_night ? Icons.light_mode : Icons.dark_mode, color: fg),
                      ),
                    ],
                  ),
                  Text(
                    _titleController.text,
                    style: TextStyle(
                      fontSize: _fontSize + 6,
                      fontWeight: FontWeight.bold,
                      color: fg,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _bodyController.text.isEmpty ? 'لا يوجد نص بعد.' : _bodyController.text,
                    style: TextStyle(
                      fontSize: _fontSize,
                      height: 1.7,
                      color: fg.withOpacity(_bodyController.text.isEmpty ? 0.6 : 1),
                    ),
                  ),
                ],
              )
            : Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    TextField(
                      controller: _titleController,
                      decoration: const InputDecoration(labelText: 'عنوان الفصل'),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: TextField(
                        controller: _bodyController,
                        maxLines: null,
                        expands: true,
                        textAlignVertical: TextAlignVertical.top,
                        decoration: const InputDecoration(
                          labelText: 'النص',
                          border: OutlineInputBorder(),
                          alignLabelWithHint: true,
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

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
