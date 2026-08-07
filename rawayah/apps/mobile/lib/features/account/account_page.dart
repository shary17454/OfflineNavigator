import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/auth_state.dart';
import '../../core/theme.dart';

class AccountPage extends ConsumerStatefulWidget {
  const AccountPage({super.key});

  @override
  ConsumerState<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends ConsumerState<AccountPage> {
  Map<String, dynamic>? _me;
  bool _loading = true;
  bool _confirmDelete = false;
  final _passwordController = TextEditingController();
  String? _message;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient().get<Map<String, dynamic>>('/users/me');
      setState(() => _me = res.data);
    } catch (_) {
      if (mounted) context.go('/login');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    await ref.read(authControllerProvider.notifier).signOut();
    if (mounted) context.go('/home');
  }

  Future<void> _deleteAccount() async {
    if (_passwordController.text.isEmpty) {
      setState(() => _message = 'يجب إدخال كلمة المرور لتأكيد الحذف');
      return;
    }
    try {
      await ApiClient().post('/auth/account/delete', data: {'password': _passwordController.text});
      await ref.read(authControllerProvider.notifier).signOut();
      if (mounted) context.go('/home');
    } catch (_) {
      setState(() => _message = 'فشل حذف الحساب — تحقق من كلمة المرور');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('حسابي'),
          actions: [
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              tooltip: 'الإعدادات',
              onPressed: () => context.push('/settings'),
            ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _me == null
                ? const Center(child: Text('تعذّر تحميل بيانات الحساب'))
                : ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      Text('الاسم: ${(_me!['profile'] as Map?)?['displayName'] ?? 'بدون اسم'}'),
                      Text('البريد الإلكتروني: ${_me!['email']}'),
                      const SizedBox(height: 16),
                      OutlinedButton(onPressed: _logout, child: const Text('تسجيل الخروج')),

                      const Divider(height: 32),
                      Text('العضوية المهنية', style: TextStyle(fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
                      const SizedBox(height: 4),
                      Text(
                        'الرواة والمؤرخون المعتمدون يمكنهم إضافة المواد، وتبقى كل مادة قيد مراجعة المالك قبل نشرها.',
                        style: TextStyle(fontSize: 12, color: context.rawaya.textSecondary),
                      ),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(Icons.badge_outlined, color: context.rawaya.gold),
                        title: const Text('تقديم طلب عضوية (راوٍ / مؤرخ)'),
                        onTap: () => context.push('/contributors/apply'),
                      ),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(Icons.fact_check_outlined, color: context.rawaya.gold),
                        title: const Text('مساهماتي وحالة مراجعتها'),
                        onTap: () => context.push('/my-contributions'),
                      ),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(Icons.privacy_tip_outlined, color: context.rawaya.gold),
                        title: const Text('الشروط والسياسات'),
                        onTap: () => context.push('/policies'),
                      ),

                      const Divider(height: 32),
                      Text('تصدير بياناتي', style: TextStyle(fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
                      const SizedBox(height: 8),
                      const Text('يمكنك طلب نسخة من كل بياناتك الشخصية على المنصة.'),
                      TextButton(
                        onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('استخدم صفحة الحساب على الموقع لتنزيل ملف بياناتك')),
                        ),
                        child: const Text('تصدير بياناتي'),
                      ),
                      const Divider(height: 32),
                      Text('حذف الحساب', style: TextStyle(fontWeight: FontWeight.bold, color: context.rawaya.danger)),
                      const SizedBox(height: 8),
                      const Text('عملية نهائية: يُحذف كل ما هو تفضيل شخصي فعليًا، وتُنزع هويتك عن بريدك وكلمة مرورك بشكل غير قابل للاسترجاع.'),
                      if (!_confirmDelete)
                        TextButton(
                          onPressed: () => setState(() => _confirmDelete = true),
                          style: TextButton.styleFrom(foregroundColor: context.rawaya.danger),
                          child: const Text('حذف حسابي'),
                        )
                      else ...[
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(labelText: 'كلمة المرور للتأكيد'),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            TextButton(
                              onPressed: () => setState(() => _confirmDelete = false),
                              child: const Text('إلغاء'),
                            ),
                            FilledButton(
                              onPressed: _deleteAccount,
                              style: FilledButton.styleFrom(backgroundColor: context.rawaya.danger),
                              child: const Text('تأكيد الحذف النهائي'),
                            ),
                          ],
                        ),
                      ],
                      if (_message != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(_message!, style: TextStyle(color: context.rawaya.danger)),
                        ),
                    ],
                  ),
      ),
    );
  }
}
