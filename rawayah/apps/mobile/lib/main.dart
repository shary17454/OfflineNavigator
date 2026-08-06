import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'features/home/home_page.dart';
import 'features/search/search_page.dart';
import 'features/auth/login_page.dart';
import 'features/auth/register_page.dart';
import 'features/offline/offline_library_page.dart';
import 'features/poets/poets_page.dart';
import 'features/poets/poet_detail_page.dart';
import 'features/poems/poems_page.dart';
import 'features/poems/poem_detail_page.dart';
import 'features/stories/stories_page.dart';
import 'features/stories/story_detail_page.dart';
import 'features/books/books_page.dart';
import 'features/books/book_detail_page.dart';
import 'features/proverbs/proverbs_page.dart';
import 'features/proverbs/proverb_detail_page.dart';
import 'features/vocabulary/vocabulary_page.dart';
import 'features/vocabulary/vocabulary_detail_page.dart';
import 'features/places/places_page.dart';
import 'features/places/place_detail_page.dart';
import 'features/topics/topics_page.dart';
import 'features/topics/topic_detail_page.dart';
import 'features/favorites/favorites_page.dart';
import 'features/questions/questions_page.dart';
import 'features/questions/question_detail_page.dart';
import 'features/questions/create_question_page.dart';
import 'features/account/account_page.dart';
import 'features/account/settings_page.dart';
import 'features/notifications/notifications_page.dart';
import 'features/static/static_pages.dart';
import 'features/horses/horses_page.dart';
import 'features/horses/horse_detail_page.dart';
import 'features/camels/camels_page.dart';
import 'features/camels/camel_detail_page.dart';
import 'features/hunting/hunting_page.dart';
import 'features/hunting/hunting_detail_page.dart';
import 'features/hunting/hunting_dogs_page.dart';
import 'features/hunting/hunting_dog_detail_page.dart';
import 'features/reading_lists/reading_lists_page.dart';
import 'features/media/media_page.dart';
import 'screens/placeholder_page.dart';

void main() {
  runApp(const ProviderScope(child: RawayaApp()));
}

class RawayaRoutes {
  // مسارات لم تُبنَ شاشاتها الحقيقية بعد — إما خارج نطاق MVP صراحة
  // (الاشتراكات المدفوعة، مستبعدة عمدًا حسب الطلب الأصلي) أو مشغلات وسائط
  // مستقلة بلا سياق (لا يوجد رابط فعلي لأي مقطع محدد بعد — قائمة الوسائط
  // نفسها حقيقية ومربوطة). البلاغات كميزة مستقلة غير مطلوبة لأن الإبلاغ
  // يعمل فعليًا من الورقة السفلية العامة على صفحات المحتوى.
  static const placeholders = [
    '/subscriptions',
    '/audio-player',
    '/video-player',
    '/reports',
  ];

  static String title(String route) {
    switch (route) {
      case '/subscriptions':
        return 'الاشتراكات';
      case '/audio-player':
        return 'مشغل الصوت';
      case '/video-player':
        return 'مشغل الفيديو';
      case '/reports':
        return 'البلاغات';
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
      GoRoute(path: '/login', name: 'login', builder: (context, state) => const LoginPage()),
      GoRoute(path: '/register', name: 'register', builder: (context, state) => const RegisterPage()),
      GoRoute(path: '/profile', name: 'profile', builder: (context, state) => const AccountPage()),
      GoRoute(path: '/settings', name: 'settings', builder: (context, state) => const SettingsPage()),
      GoRoute(path: '/notifications', name: 'notifications', builder: (context, state) => const NotificationsPage()),
      GoRoute(path: '/favorites', name: 'favorites', builder: (context, state) => const FavoritesPage()),
      GoRoute(path: '/about', name: 'about', builder: (context, state) => const AboutPage()),
      GoRoute(path: '/privacy', name: 'privacy', builder: (context, state) => const PrivacyPage()),
      GoRoute(path: '/terms', name: 'terms', builder: (context, state) => const TermsPage()),
      GoRoute(path: '/contact', name: 'contact', builder: (context, state) => const ContactPage()),

      GoRoute(
        path: '/poets',
        name: 'poets',
        builder: (context, state) => const PoetsPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => PoetDetailPage(poetId: state.pathParameters['id']!))],
      ),
      GoRoute(
        path: '/poems',
        name: 'poems',
        builder: (context, state) => const PoemsPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => PoemDetailPage(poemId: state.pathParameters['id']!))],
      ),
      GoRoute(
        path: '/stories',
        name: 'stories',
        builder: (context, state) => const StoriesPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => StoryDetailPage(storyId: state.pathParameters['id']!))],
      ),
      GoRoute(
        path: '/books',
        name: 'books',
        builder: (context, state) => const BooksPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => BookDetailPage(bookId: state.pathParameters['id']!))],
      ),
      GoRoute(
        path: '/proverbs',
        name: 'proverbs',
        builder: (context, state) => const ProverbsPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => ProverbDetailPage(proverbId: state.pathParameters['id']!))],
      ),
      GoRoute(
        path: '/vocabulary',
        name: 'vocabulary',
        builder: (context, state) => const VocabularyPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => VocabularyDetailPage(termId: state.pathParameters['id']!))],
      ),
      GoRoute(
        path: '/places',
        name: 'places',
        builder: (context, state) => const PlacesPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => PlaceDetailPage(placeId: state.pathParameters['id']!))],
      ),
      GoRoute(
        path: '/topics',
        name: 'topics',
        builder: (context, state) => const TopicsPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => TopicDetailPage(topicId: state.pathParameters['id']!))],
      ),
      GoRoute(
        path: '/questions',
        name: 'questions',
        builder: (context, state) => const QuestionsPage(),
        routes: [
          GoRoute(path: 'new', builder: (context, state) => const CreateQuestionPage()),
          GoRoute(path: ':id', builder: (context, state) => QuestionDetailPage(questionId: state.pathParameters['id']!)),
        ],
      ),
      GoRoute(
        path: '/horses',
        name: 'horses',
        builder: (context, state) => const HorsesPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => HorseDetailPage(horseId: state.pathParameters['id']!))],
      ),
      GoRoute(
        path: '/camels',
        name: 'camels',
        builder: (context, state) => const CamelsPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => CamelDetailPage(camelId: state.pathParameters['id']!))],
      ),
      GoRoute(
        path: '/hunting',
        name: 'hunting',
        builder: (context, state) => const HuntingPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => HuntingDetailPage(itemId: state.pathParameters['id']!))],
      ),
      GoRoute(
        path: '/hunting-dogs',
        name: 'hunting-dogs',
        builder: (context, state) => const HuntingDogsPage(),
        routes: [GoRoute(path: ':id', builder: (context, state) => HuntingDogDetailPage(breedId: state.pathParameters['id']!))],
      ),
      GoRoute(path: '/reading-lists', name: 'reading-lists', builder: (context, state) => const ReadingListsPage()),
      GoRoute(path: '/media', name: 'media', builder: (context, state) => const MediaPage()),

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
      ...RawayaRoutes.placeholders.map(
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
      title: 'موروث',
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
