import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class OfflineChapter {
  OfflineChapter({
    required this.id,
    required this.title,
    required this.body,
    required this.updatedAt,
  });

  final String id;
  String title;
  String body;
  DateTime updatedAt;

  int get wordCount {
    final cleaned = body.trim();
    if (cleaned.isEmpty) return 0;
    return cleaned
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .length;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'updatedAt': updatedAt.toIso8601String(),
      };

  factory OfflineChapter.fromJson(Map<String, dynamic> json) => OfflineChapter(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? '',
        updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ??
            DateTime.now(),
      );
}

class OfflineWork {
  OfflineWork({
    required this.id,
    required this.title,
    required this.authorName,
    required this.genre,
    required this.synopsis,
    required this.chapters,
    required this.updatedAt,
    this.isFavorite = false,
  });

  final String id;
  String title;
  String authorName;
  String genre;
  String synopsis;
  List<OfflineChapter> chapters;
  DateTime updatedAt;
  bool isFavorite;

  int get totalWordCount => chapters.fold(0, (sum, c) => sum + c.wordCount);

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'authorName': authorName,
        'genre': genre,
        'synopsis': synopsis,
        'isFavorite': isFavorite,
        'updatedAt': updatedAt.toIso8601String(),
        'chapters': chapters.map((c) => c.toJson()).toList(),
      };

  factory OfflineWork.fromJson(Map<String, dynamic> json) => OfflineWork(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        authorName: json['authorName'] as String? ?? '',
        genre: json['genre'] as String? ?? 'قصة',
        synopsis: json['synopsis'] as String? ?? '',
        isFavorite: json['isFavorite'] as bool? ?? false,
        updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ??
            DateTime.now(),
        chapters: ((json['chapters'] as List?) ?? [])
            .whereType<Map>()
            .map((item) =>
                OfflineChapter.fromJson(Map<String, dynamic>.from(item)))
            .toList(),
      );
}

class OfflineLibraryStore {
  static const _key = 'rawaya_offline_works_v1';

  Future<List<OfflineWork>> loadWorks() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) {
      final seeded = [_seedWork()];
      await saveWorks(seeded);
      return seeded;
    }
    final decoded = jsonDecode(raw);
    if (decoded is! List) return [];
    return decoded
        .whereType<Map>()
        .map((item) => OfflineWork.fromJson(Map<String, dynamic>.from(item)))
        .toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
  }

  Future<void> saveWorks(List<OfflineWork> works) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _key,
      jsonEncode(works.map((work) => work.toJson()).toList()),
    );
  }

  OfflineWork _seedWork() {
    return OfflineWork(
      id: 'seed-1',
      title: 'ظل على الرمال',
      authorName: 'مساهمة تجريبية',
      genre: 'قصة',
      synopsis: 'نص تجريبي محلي للقراءة والكتابة دون اتصال داخل تطبيق موروث.',
      updatedAt: DateTime.now(),
      isFavorite: true,
      chapters: [
        OfflineChapter(
          id: 'seed-ch-1',
          title: 'الخريطة',
          body:
              'قبل أن تشرق الشمس على الكثبان، وقف راشد يطوي خريطة بالية بين يديه. لم تكن الخريطة كاملة، لكن الخطوط القليلة التي بقيت عليها كانت كافية ليبدأ.',
          updatedAt: DateTime.now(),
        ),
        OfflineChapter(
          id: 'seed-ch-2',
          title: 'البئر الأولى',
          body:
              'عند البئر المهجورة وجدوا نقشًا صغيرًا على حجرٍ أسود. جلس راشد يقرأ النقش مرة بعد مرة، وكلما أعاد القراءة بدا له أن الرواية لم تبدأ من هنا.',
          updatedAt: DateTime.now(),
        ),
      ],
    );
  }
}
