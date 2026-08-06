import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';

class HeritageCategory {
  const HeritageCategory({required this.title, required this.image, required this.route});

  final String title;
  final String image;
  final String route;
}

const _kBrown = Color(0xFF2A1F14);
const _kGold = Color(0xFFB68843);
const _kCream = Color(0xFFFDF7ED);

const _kCategories = [
  HeritageCategory(title: 'الشعر', image: 'assets/images/cat_poetry.jpg', route: '/poems'),
  HeritageCategory(title: 'القصص', image: 'assets/images/cat_stories.jpg', route: '/stories'),
  HeritageCategory(title: 'الخيل', image: 'assets/images/cat_horses.jpg', route: '/horses'),
  HeritageCategory(title: 'الإبل', image: 'assets/images/cat_camels.jpg', route: '/camels'),
];

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _navIndex = 4;
  List<Map<String, dynamic>> _poets = const [];
  Map<String, dynamic>? _latestPoem;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        ApiClient().get<List<dynamic>>('/poets'),
        ApiClient().get<List<dynamic>>('/poems'),
      ]);
      final poets = (results[0].data ?? []).cast<Map<String, dynamic>>();
      final poems = (results[1].data ?? []).cast<Map<String, dynamic>>();
      setState(() {
        _poets = poets.take(6).toList();
        _latestPoem = poems.isNotEmpty ? poems.first : null;
      });
    } catch (_) {
      // لا بيانات وهمية بديلة — الأقسام الفارغة تُعرض ببساطة كفارغة.
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onNavTap(int index) {
    setState(() => _navIndex = index);
    switch (index) {
      case 0:
        context.go('/profile');
      case 1:
        context.go('/reading-lists');
      case 2:
        context.go('/favorites');
      case 3:
        context.go('/search');
      default:
        context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: _kCream,
        body: SafeArea(
          child: Column(
            children: [
              _buildHeader(context),
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                        children: [
                          _buildSearchField(context),
                          const SizedBox(height: 16),
                          _buildHeroQuote(),
                          const SizedBox(height: 20),
                          _sectionTitle('اكتشف التراث'),
                          const SizedBox(height: 10),
                          _buildCategoriesRow(context),
                          const SizedBox(height: 20),
                          _sectionTitle('أحدث القصائد', actionLabel: 'عرض الكل', onAction: () => context.push('/poems')),
                          const SizedBox(height: 10),
                          if (_latestPoem != null) _buildLatestPoemCard(context, _latestPoem!) else const Text('لا توجد قصائد منشورة بعد'),
                          const SizedBox(height: 20),
                          _sectionTitle('شعراء بارزون', actionLabel: 'عرض الكل', onAction: () => context.push('/poets')),
                          const SizedBox(height: 10),
                          if (_poets.isNotEmpty) _buildPoetsRow(context) else const Text('لا يوجد شعراء منشورون بعد'),
                        ],
                      ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: _buildBottomNav(),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      color: _kBrown,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.menu, color: _kCream),
            onPressed: () {},
          ),
          const Spacer(),
          const Text(
            'موروث',
            style: TextStyle(
              color: _kGold,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.notifications_none, color: _kCream),
            onPressed: () => context.go('/notifications'),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchField(BuildContext context) {
    return TextField(
      readOnly: true,
      onTap: () => context.go('/search'),
      textAlign: TextAlign.right,
      decoration: InputDecoration(
        hintText: 'ابحث في موروث...',
        prefixIcon: const Icon(Icons.search),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  Widget _buildHeroQuote() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Image.asset(
        'assets/images/hero_bg.jpg',
        height: 150,
        width: double.infinity,
        fit: BoxFit.cover,
      ),
    );
  }

  Widget _sectionTitle(String title, {String? actionLabel, VoidCallback? onAction}) {
    return Row(
      children: [
        if (actionLabel != null)
          TextButton(
            onPressed: onAction,
            child: Text(actionLabel, style: const TextStyle(color: _kGold)),
          ),
        const Spacer(),
        Text(
          title,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: _kBrown),
        ),
      ],
    );
  }

  Widget _buildCategoriesRow(BuildContext context) {
    return SizedBox(
      height: 108,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        reverse: true,
        itemCount: _kCategories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final category = _kCategories[index];
          return SizedBox(
            width: 84,
            child: GestureDetector(
              onTap: () => context.push(category.route),
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.asset(
                      category.image,
                      width: 84,
                      height: 78,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    category.title,
                    style: const TextStyle(fontSize: 13, color: _kBrown),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLatestPoemCard(BuildContext context, Map<String, dynamic> poem) {
    final poetName = (poem['poet'] as Map?)?['fullName']?.toString();
    return GestureDetector(
      onTap: () => context.push('/poems/${poem['id']}'),
      child: Card(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(poem['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              if (poetName != null) ...[
                const SizedBox(height: 4),
                Text('للشاعر: $poetName', style: const TextStyle(fontSize: 13, color: Colors.black54)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPoetsRow(BuildContext context) {
    return SizedBox(
      height: 90,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        reverse: true,
        itemCount: _poets.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (context, index) {
          final poet = _poets[index];
          return SizedBox(
            width: 68,
            child: GestureDetector(
              onTap: () => context.push('/poets/${poet['id']}'),
              child: Column(
                children: [
                  const CircleAvatar(radius: 30, child: Icon(Icons.person_outline)),
                  const SizedBox(height: 6),
                  Text(
                    poet['fullName']?.toString() ?? '',
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: _kBrown),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBottomNav() {
    return BottomNavigationBar(
      currentIndex: _navIndex,
      onTap: _onNavTap,
      type: BottomNavigationBarType.fixed,
      selectedItemColor: _kGold,
      unselectedItemColor: Colors.black45,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'حسابي'),
        BottomNavigationBarItem(icon: Icon(Icons.menu_book_outlined), label: 'المكتبة'),
        BottomNavigationBarItem(icon: Icon(Icons.favorite_border), label: 'المفضلة'),
        BottomNavigationBarItem(icon: Icon(Icons.grid_view_outlined), label: 'الأقسام'),
        BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'الرئيسية'),
      ],
    );
  }
}
