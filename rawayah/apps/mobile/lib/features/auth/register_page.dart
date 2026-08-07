import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/auth_state.dart';
import '../../core/theme.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _error;
  bool _loading = false;

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient().post<Map<String, dynamic>>('/auth/register', data: {
        'displayName': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
      });
      final data = res.data ?? {};
      await ref.read(authControllerProvider.notifier).signIn(
            accessToken: data['accessToken'] as String,
            refreshToken: data['refreshToken'] as String?,
          );
      if (mounted) context.go('/profile');
    } catch (_) {
      setState(() => _error = 'فشل إنشاء الحساب — تحقق من البيانات المُدخلة');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.rawaya.background,
        appBar: AppBar(title: const Text('إنشاء حساب جديد')),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'الاسم', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'البريد الإلكتروني', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'كلمة المرور (8 أحرف على الأقل)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 20),
              if (_error != null) Text(_error!, style: TextStyle(color: context.rawaya.danger)),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: _loading ? null : _submit,
                style: FilledButton.styleFrom(backgroundColor: context.rawaya.gold),
                child: _loading ? const CircularProgressIndicator() : const Text('إنشاء الحساب'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
