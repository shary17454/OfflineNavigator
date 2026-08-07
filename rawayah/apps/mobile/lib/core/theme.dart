import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// هوية "المجلس" — الطابع البصري الذي اختاره المالك من بين ستة اتجاهات
/// نجدية: بنّي عميق كجدران المجلس، وذهب معدني كخيوط السدو والحواشي
/// المذهّبة، وخط فاصل رفيع تحت كل عنوان كما يُحدّ صدر المجلس بخط ذهبي.
/// هادئ ومقروء لا صاخب — النص التراثي هو البطل لا الزخرفة.
///
/// كل لون له مقابل في الوضع الليلي، ولا يُستخدم أي لون ثابت في الشاشات —
/// تُقرأ الألوان من `context.rawaya` حتى يعمل الوضعان دون تكرار كود.

// ===== نهاري: صفحة مخطوطة قديمة =====
const _lightBackground = Color(0xFFFAF6EF);
const _lightSurface = Color(0xFFFFFFFF);
const _lightSurfaceAlt = Color(0xFFF2EADC);
const _lightTextPrimary = Color(0xFF241C13);
const _lightTextSecondary = Color(0xFF6E5E48);
const _lightBorder = Color(0xFFDCCFB4);
const _lightGold = Color(0xFFB68843);

// ===== ليلي: جلسة المجلس عند المغيب =====
const _darkBackground = Color(0xFF100D09);
const _darkSurface = Color(0xFF17110A);
const _darkSurfaceAlt = Color(0xFF201808);
const _darkTextPrimary = Color(0xFFE9DCC2);
const _darkTextSecondary = Color(0xFFA5947C);
const _darkBorder = Color(0xFF3A2F1D);
const _darkGold = Color(0xFFC9A25C);

/// حزمة ألوان التطبيق لوضع واحد.
@immutable
class RawayaColors extends ThemeExtension<RawayaColors> {
  const RawayaColors({
    required this.background,
    required this.surface,
    required this.surfaceAlt,
    required this.textPrimary,
    required this.textSecondary,
    required this.border,
    required this.gold,
    required this.isDark,
  });

  final Color background;
  final Color surface;
  final Color surfaceAlt;
  final Color textPrimary;
  final Color textSecondary;
  final Color border;
  final Color gold;
  final bool isDark;

  static const light = RawayaColors(
    background: _lightBackground,
    surface: _lightSurface,
    surfaceAlt: _lightSurfaceAlt,
    textPrimary: _lightTextPrimary,
    textSecondary: _lightTextSecondary,
    border: _lightBorder,
    gold: _lightGold,
    isDark: false,
  );

  static const dark = RawayaColors(
    background: _darkBackground,
    surface: _darkSurface,
    surfaceAlt: _darkSurfaceAlt,
    textPrimary: _darkTextPrimary,
    textSecondary: _darkTextSecondary,
    border: _darkBorder,
    gold: _darkGold,
    isDark: true,
  );

  /// نص فوق الذهب المصمت (الشرائح والأزرار المفعّلة).
  Color get onGold => isDark ? const Color(0xFF17110A) : Colors.white;

  Color get warning => isDark ? const Color(0xFFE0B45C) : const Color(0xFF8D6E00);
  Color get danger => isDark ? const Color(0xFFE07A62) : const Color(0xFF9B2C1A);
  Color get success => isDark ? const Color(0xFF8FB77E) : const Color(0xFF3E6B34);

  /// تظليل ذهبي خفيف لصناديق الملاحظة والتنبيه — بديل عن لون كريمي ثابت
  /// كان يختفي على الخلفية الليلية.
  Color get warningSurface => gold.withValues(alpha: isDark ? 0.16 : 0.10);

  @override
  RawayaColors copyWith({
    Color? background,
    Color? surface,
    Color? surfaceAlt,
    Color? textPrimary,
    Color? textSecondary,
    Color? border,
    Color? gold,
    bool? isDark,
  }) {
    return RawayaColors(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceAlt: surfaceAlt ?? this.surfaceAlt,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      border: border ?? this.border,
      gold: gold ?? this.gold,
      isDark: isDark ?? this.isDark,
    );
  }

  @override
  RawayaColors lerp(ThemeExtension<RawayaColors>? other, double t) {
    if (other is! RawayaColors) return this;
    return RawayaColors(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceAlt: Color.lerp(surfaceAlt, other.surfaceAlt, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      border: Color.lerp(border, other.border, t)!,
      gold: Color.lerp(gold, other.gold, t)!,
      isDark: t < 0.5 ? isDark : other.isDark,
    );
  }
}

extension RawayaThemeContext on BuildContext {
  /// ألوان هوية "المجلس" للوضع الحالي (نهاري أو ليلي).
  RawayaColors get rawaya => Theme.of(this).extension<RawayaColors>() ?? RawayaColors.light;
}

ThemeData _buildTheme(RawayaColors c) {
  final brightness = c.isDark ? Brightness.dark : Brightness.light;

  final base = ThemeData(
    brightness: brightness,
    scaffoldBackgroundColor: c.background,
    colorScheme: ColorScheme.fromSeed(seedColor: c.gold, brightness: brightness).copyWith(
      surface: c.surface,
      primary: c.gold,
      onSurface: c.textPrimary,
    ),
  );

  return base.copyWith(
    extensions: [c],
    appBarTheme: AppBarTheme(
      backgroundColor: c.background,
      foregroundColor: c.textPrimary,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(fontSize: 21, fontWeight: FontWeight.bold, color: c.textPrimary, letterSpacing: .2),
    ),
    cardTheme: CardThemeData(
      color: c.surface,
      elevation: 0,
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: c.border)),
    ),
    listTileTheme: ListTileThemeData(
      textColor: c.textPrimary,
      iconColor: c.gold,
      subtitleTextStyle: TextStyle(color: c.textSecondary, fontSize: 13),
    ),
    dividerTheme: DividerThemeData(color: c.border, thickness: 1),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c.surface,
      labelStyle: TextStyle(color: c.textSecondary),
      hintStyle: TextStyle(color: c.textSecondary),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: c.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: c.border)),
      focusedBorder:
          OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: c.gold, width: 2)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: c.gold,
        foregroundColor: c.onGold,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontWeight: FontWeight.bold),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: c.textPrimary,
        side: BorderSide(color: c.border),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: c.gold)),
    floatingActionButtonTheme: FloatingActionButtonThemeData(backgroundColor: c.gold, foregroundColor: c.onGold),
    tabBarTheme: TabBarThemeData(
      labelColor: c.gold,
      unselectedLabelColor: c.textSecondary,
      indicatorColor: c.gold,
      dividerColor: c.border,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: Colors.transparent,
      side: BorderSide(color: c.border),
      labelStyle: TextStyle(color: c.textPrimary, fontSize: 13),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      shape: const StadiumBorder(),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: c.gold),
    dialogTheme: DialogThemeData(
      backgroundColor: c.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: c.surfaceAlt,
      contentTextStyle: TextStyle(color: c.textPrimary),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.gold : c.textSecondary),
      trackColor: WidgetStateProperty.resolveWith(
        (s) => s.contains(WidgetState.selected) ? c.gold.withValues(alpha: .4) : c.border,
      ),
    ),
    textTheme: base.textTheme.apply(bodyColor: c.textPrimary, displayColor: c.textPrimary),
    iconTheme: IconThemeData(color: c.gold),
  );
}

final rawayaLightTheme = _buildTheme(RawayaColors.light);
final rawayaDarkTheme = _buildTheme(RawayaColors.dark);

/// ===== عناصر الهوية المشتركة =====

/// خط ذهبي رفيع يتلاشى عند طرفيه — الحدّ الفاصل تحت عنوان كل شاشة،
/// كالخط الذهبي الذي يحدّ صدر المجلس.
class RawayaGoldDivider extends StatelessWidget {
  const RawayaGoldDivider({super.key, this.margin = const EdgeInsets.symmetric(horizontal: 24)});

  final EdgeInsets margin;

  @override
  Widget build(BuildContext context) {
    final gold = context.rawaya.gold;
    return Container(
      height: 1.6,
      margin: margin,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [gold.withValues(alpha: 0), gold, gold.withValues(alpha: 0)],
        ),
      ),
    );
  }
}

/// عنوان قسم فرعي بالطابع الذهبي المصغّر (مثل «حسب نوع الشعر»).
class RawayaSectionLabel extends StatelessWidget {
  const RawayaSectionLabel(this.text, {super.key, this.icon});

  final String text;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final gold = context.rawaya.gold;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[Icon(icon, size: 16, color: gold), const SizedBox(width: 6)],
        Text(
          text,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: gold, letterSpacing: .3),
        ),
      ],
    );
  }
}

// ===== إدارة وضع السمة (نهاري / ليلي / حسب الجهاز) =====

const _themeModePrefKey = 'rawaya_theme_mode';

class ThemeModeController extends StateNotifier<ThemeMode> {
  ThemeModeController() : super(ThemeMode.system) {
    _restore();
  }

  Future<void> _restore() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_themeModePrefKey);
    switch (saved) {
      case 'light':
        state = ThemeMode.light;
      case 'dark':
        state = ThemeMode.dark;
      default:
        state = ThemeMode.system;
    }
  }

  Future<void> setMode(ThemeMode mode) async {
    state = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeModePrefKey, mode.name);
  }
}

final themeModeProvider = StateNotifierProvider<ThemeModeController, ThemeMode>((ref) => ThemeModeController());
