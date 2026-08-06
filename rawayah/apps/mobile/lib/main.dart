import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'features/home/home_page.dart';
import 'features/search/search_page.dart';
import 'features/auth/auth_page.dart';
import 'features/offline/offline_library_page.dart';
import 'screens/placeholder_page.dart';

void main() {
  runApp(const ProviderScope(child: RawayaApp()));
}

class RawayaRoutes {
  static const list = [
    '/home',
    '/search',
    '/auth',
    '/poetry',
    '/poems',
    '/stories',
    '/books',
    '/places',
    '/horses',
    '/camels',
    '/hunting',
    '/hunting-dogs',
    '/favorites',
    '/reading-lists',
    '/questions',
    '/notifications',
    '/profile',
    '/settings',
    '/subscriptions',
    '/privacy',
    '/terms',
    '/about',
    '/contact',
    '/offline',
    '/audio-player',
    '/video-player',
    '/media',
    '/reports',
    '/search-results',
    '/admin',
  ];

  static String title(String route) {
    switch (route) {
      case '/home':
        return 'الرئيسية';
      case '/search':
        return 'البحث';
      case '/auth':
        return 'التسجيل';
      case '/poetry':
        return 'الشعر';
      case '/favorites':
        return 'المفضلة';
      case '/offline':
        return 'دفتر دون اتصال';
      case '/profile':
        return 'حسابي';
      case '/reading-lists':
        return 'المكتبة';
      case '/poems':
        return 'القصائد';
      case '/stories':
        return 'القصص';
      case '/books':
        return 'الكتب والمراجع';
      case '/places':
        return 'الأماكن والمعالم';
      case '/horses':
        return 'الخيل';
      case '/camels':
        return 'الإبل';
      case '/hunting':
        return 'الصقارة والقنص';
      case '/hunting-dogs':
        return 'كلاب الصيد';
      case '/questions':
        return 'الأسئلة';
      case '/notifications':
        return 'الإشعارات';
      case '/settings':
        return 'الإعدادات';
      case '/subscriptions':
        return 'الاشتراكات';
      case '/privacy':
        return 'الخصوصية';
      case '/terms':
        return 'الشروط';
      case '/about':
        return 'عن التطبيق';
      case '/contact':
        return 'تواصل معنا';
      default:
        return route.replaceFirst('/', '');
    }
  }
}

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    routes: [
      GoRoute(path: '/', name: 'splash', builder: (context, state) => const SplashPage()),
      GoRoute(path: '/home', name: 'home', builder: (context, state) => const HomePage()),
      GoRoute(path: '/search', name: 'search', builder: (context, state) => const SearchPage()),
      GoRoute(path: '/auth', name: 'auth', builder: (context, state) => const AuthPage()),
      GoRoute(
        path: '/offline',
        name: 'offline',
        builder: (context, state) => const OfflineLibraryPage(),
        routes: [
          GoRoute(
            path: 'work/:workId',
            builder: (context, state) => OfflineWorkPage(
              workId: state.pathParameters['workId'] ?? '',
            ),
            routes: [
              GoRoute(
                path: 'chapter/:chapterId',
                builder: (context, state) => OfflineChapterPage(
                  workId: state.pathParameters['workId'] ?? '',
                  chapterId: state.pathParameters['chapterId'] ?? '',
                ),
              ),
            ],
          ),
        ],
      ),
      ...RawayaRoutes.list
          .where((path) => !['/home', '/search', '/auth', '/offline'].contains(path))
          .map(
            (path) => GoRoute(
              path: path,
              builder: (context, state) => PlaceholderPage(title: RawayaRoutes.title(path)),
            ),
          ),
    ],
    initialLocation: '/',
  );
});

class RawayaApp extends ConsumerWidget {
  const RawayaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'رواية التراث',
      routerConfig: router,
      theme: ThemeData(
        fontFamily: 'Tajawal',
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFB68843)),
        scaffoldBackgroundColor: const Color(0xFFFDF7ED),
      ),
      locale: const Locale('ar', 'SA'),
      supportedLocales: const [Locale('ar', 'SA'), Locale('en', 'US')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
    );
  }
}

class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: FilledButton(
          onPressed: () => context.goNamed('home'),
          child: const Text('رواية… ذاكرة التراث العربي'),
        ),
      ),
    );
  }
}
