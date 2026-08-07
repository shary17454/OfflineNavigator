import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  static const _modeLabels = {
    ThemeMode.system: 'حسب إعدادات الجهاز',
    ThemeMode.light: 'نهاري',
    ThemeMode.dark: 'ليلي',
  };

  static const _modeIcons = {
    ThemeMode.system: Icons.brightness_auto_outlined,
    ThemeMode.light: Icons.light_mode_outlined,
    ThemeMode.dark: Icons.dark_mode_outlined,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentMode = ref.watch(themeModeProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('الإعدادات')),
        body: ListView(
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 4),
              child: RawayaSectionLabel('المظهر'),
            ),
            for (final mode in ThemeMode.values)
              RadioListTile<ThemeMode>(
                value: mode,
                groupValue: currentMode,
                onChanged: (value) {
                  if (value != null) ref.read(themeModeProvider.notifier).setMode(value);
                },
                secondary: Icon(_modeIcons[mode]),
                title: Text(_modeLabels[mode] ?? mode.name),
              ),
            const Divider(height: 24),
            ListTile(title: const Text('عن التطبيق'), trailing: const Icon(Icons.chevron_left), onTap: () => context.push('/about')),
            ListTile(title: const Text('سياسة الخصوصية'), trailing: const Icon(Icons.chevron_left), onTap: () => context.push('/privacy')),
            ListTile(title: const Text('شروط الاستخدام'), trailing: const Icon(Icons.chevron_left), onTap: () => context.push('/terms')),
            ListTile(title: const Text('تواصل معنا'), trailing: const Icon(Icons.chevron_left), onTap: () => context.push('/contact')),
          ],
        ),
      ),
    );
  }
}
