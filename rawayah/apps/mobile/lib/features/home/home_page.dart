import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

class HeritageCategory {
  const HeritageCategory({required this.title, required this.image, required this.route});

  final String title;
  final String image;
  final String route;
}

const _kCategories = [
  // «الشعر» تفتح أقسام الشعر (التصنيفات) لا قائمة القصائد المسطحة.
  HeritageCategory(title: 'الشعر', image: 'assets/images/cat_poetry.jpg', route: '/poetry'),
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
    final c = context.rawaya;
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              _buildHeader(context, c),
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                        children: [
                          _buildSearchField(context, c),
                          const SizedBox(height: 18),
                          _buildHeroQuote(c),
                          const SizedBox(height: 22),
                          _sectionTitle(c, 'اكتشف التراث'),
                          const SizedBox(height: 10),
                          _buildCategoriesRow(context, c),
                          const SizedBox(height: 22),
                          _sectionTitle(c, 'أحدث القصائد', actionLabel: 'عرض الكل', onAction: () => context.push('/poems')),
                          const SizedBox(height: 10),
                          if (_latestPoem != null)
                            _buildLatestPoemCard(context, c, _latestPoem!)
                          else
                            Text('لا توجد قصائد منشورة بعد', style: TextStyle(color: c.textSecondary)),
                          const SizedBox(height: 22),
                          _sectionTitle(c, 'شعراء بارزون', actionLabel: 'عرض الكل', onAction: () => context.push('/poets')),
                          const SizedBox(height: 10),
                          if (_poets.isNotEmpty)
                            _buildPoetsRow(context, c)
                          else
                            Text('لا يوجد شعراء منشورون بعد', style: TextStyle(color: c.textSecondary)),
                        ],
                      ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: _buildBottomNav(c),
      ),
    );
  }

  // العنوان بلا شريط لوني صلب — عنوان مركزي على خلفية الصفحة نفسها،
  // يحدّه خط ذهبي رفيع، اتساقًا مع طابع "المجلس" في بقية الشاشات.
  Widget _buildHeader(BuildContext context, RawayaColors c) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          child: Row(
            children: [
              IconButton(
                icon: Icon(Icons.menu, color: c.textPrimary),
                onPressed: () {},
              ),
              const Spacer(),
              Text(
                'موروث',
                style: TextStyle(color: c.textPrimary, fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: .3),
              ),
              const Spacer(),
              IconButton(
                icon: Icon(Icons.notifications_none, color: c.textPrimary),
                onPressed: () => context.go('/notifications'),
              ),
            ],
          ),
        ),
        const RawayaGoldDivider(),
      ],
    );
  }

  Widget _buildSearchField(BuildContext context, RawayaColors c) {
    return TextField(
      readOnly: true,
      onTap: () => context.go('/search'),
      textAlign: TextAlign.right,
      style: TextStyle(color: c.textPrimary),
      decoration: InputDecoration(
        hintText: 'ابحث في موروث...',
        prefixIcon: Icon(Icons.search, color: c.textSecondary),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: c.border)),
      ),
    );
  }

  Widget _buildHeroQuote(RawayaColors c) {
    return Container(
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: c.border)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(15),
        child: Image.asset('assets/images/hero_bg.jpg', height: 150, width: double.infinity, fit: BoxFit.cover),
      ),
    );
  }

  Widget _sectionTitle(RawayaColors c, String title, {String? actionLabel, VoidCallback? onAction}) {
    return Row(
      children: [
        if (actionLabel != null)
          TextButton(
            onPressed: onAction,
            child: Text(actionLabel, style: TextStyle(color: c.gold)),
          ),
        const Spacer(),
        Text(title, style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: c.textPrimary)),
      ],
    );
  }

  Widget _buildCategoriesRow(BuildContext context, RawayaColors c) {
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
                  Container(
                    decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), border: Border.all(color: c.border)),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(11),
                      child: Image.asset(category.image, width: 84, height: 78, fit: BoxFit.cover),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(category.title, style: TextStyle(fontSize: 13, color: c.textPrimary)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLatestPoemCard(BuildContext context, RawayaColors c, Map<String, dynamic> poem) {
    final poetName = (poem['poet'] as Map?)?['fullName']?.toString();
    return GestureDetector(
      onTap: () => context.push('/poems/${poem['id']}'),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                poem['title']?.toString() ?? '',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: c.textPrimary),
              ),
              if (poetName != null) ...[
                const SizedBox(height: 4),
                Text('للشاعر: $poetName', style: TextStyle(fontSize: 13, color: c.textSecondary)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPoetsRow(BuildContext context, RawayaColors c) {
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
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: c.surfaceAlt,
                    child: Icon(Icons.person_outline, color: c.gold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    poet['fullName']?.toString() ?? '',
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: c.textPrimary),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBottomNav(RawayaColors c) {
    return Container(
      decoration: BoxDecoration(color: c.surface, border: Border(top: BorderSide(color: c.border))),
      child: BottomNavigationBar(
        currentIndex: _navIndex,
        onTap: _onNavTap,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: c.gold,
        unselectedItemColor: c.textSecondary,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'حسابي'),
          BottomNavigationBarItem(icon: Icon(Icons.menu_book_outlined), label: 'المكتبة'),
          BottomNavigationBarItem(icon: Icon(Icons.favorite_border), label: 'المفضلة'),
          BottomNavigationBarItem(icon: Icon(Icons.grid_view_outlined), label: 'الأقسام'),
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'الرئيسية'),
        ],
      ),
    );
  }
}
