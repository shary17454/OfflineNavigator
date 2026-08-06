import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HeritageCategory {
  const HeritageCategory({required this.title, required this.image});

  final String title;
  final String image;
}

class FeaturedPoet {
  const FeaturedPoet({required this.name, required this.image});

  final String name;
  final String image;
}

const _kBrown = Color(0xFF2A1F14);
const _kGold = Color(0xFFB68843);
const _kCream = Color(0xFFFDF7ED);

const _kCategories = [
  HeritageCategory(title: 'الشعر', image: 'assets/images/cat_poetry.jpg'),
  HeritageCategory(title: 'القصص', image: 'assets/images/cat_stories.jpg'),
  HeritageCategory(title: 'الخيل', image: 'assets/images/cat_horses.jpg'),
  HeritageCategory(title: 'الإبل', image: 'assets/images/cat_camels.jpg'),
];

const _kPoets = [
  FeaturedPoet(name: 'عنترة بن شداد', image: 'assets/images/poet1.jpg'),
  FeaturedPoet(name: 'طرفة بن العبد', image: 'assets/images/poet2.jpg'),
  FeaturedPoet(name: 'امرؤ القيس', image: 'assets/images/poet3.jpg'),
  FeaturedPoet(name: 'المتنبي', image: 'assets/images/poet4.jpg'),
];

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _navIndex = 4;

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
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                  children: [
                    _buildSearchField(context),
                    const SizedBox(height: 16),
                    _buildHeroQuote(),
                    const SizedBox(height: 20),
                    _sectionTitle('اكتشف التراث'),
                    const SizedBox(height: 10),
                    _buildCategoriesRow(),
                    const SizedBox(height: 20),
                    _sectionTitle('أحدث القصائد', actionLabel: 'عرض الكل'),
                    const SizedBox(height: 10),
                    _buildLatestPoemCard(),
                    const SizedBox(height: 20),
                    _sectionTitle('شعراء بارزون', actionLabel: 'عرض الكل'),
                    const SizedBox(height: 10),
                    _buildPoetsRow(),
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

  Widget _sectionTitle(String title, {String? actionLabel}) {
    return Row(
      children: [
        if (actionLabel != null)
          TextButton(
            onPressed: () {},
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

  Widget _buildCategoriesRow() {
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
              onTap: () => context.go('/search'),
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

  Widget _buildLatestPoemCard() {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.asset(
                'assets/images/poem_thumb.jpg',
                width: 64,
                height: 64,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'يا طارق الوادي',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'للشاعر: فهد بن سعد',
                    style: TextStyle(fontSize: 13, color: Colors.black54),
                  ),
                  SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.remove_red_eye_outlined, size: 14, color: Colors.black45),
                      SizedBox(width: 4),
                      Text('1.2K', style: TextStyle(fontSize: 12, color: Colors.black54)),
                      SizedBox(width: 12),
                      Icon(Icons.favorite_border, size: 14, color: Colors.black45),
                      SizedBox(width: 4),
                      Text('356', style: TextStyle(fontSize: 12, color: Colors.black54)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPoetsRow() {
    return SizedBox(
      height: 90,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        reverse: true,
        itemCount: _kPoets.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (context, index) {
          final poet = _kPoets[index];
          return SizedBox(
            width: 68,
            child: Column(
              children: [
                CircleAvatar(radius: 30, backgroundImage: AssetImage(poet.image)),
                const SizedBox(height: 6),
                Text(
                  poet.name,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, color: _kBrown),
                ),
              ],
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
