import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/auth_state.dart';
import '../../core/theme.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _codeController = TextEditingController();
  String? _pendingToken;
  String? _error;
  bool _loading = false;

  Future<void> _submitLogin() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient().post<Map<String, dynamic>>('/auth/login', data: {
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
      });
      final data = res.data ?? {};
      // حسابات OWNER تمر إلزاميًا بخطوة تحقق ثنائي قبل صدور أي رمز وصول
      // كامل — يجب التعامل مع requires2FA هنا، لا افتراض نجاح الدخول مباشرة
      // (خطأ حقيقي وُجد وأُصلح في نموذجي دخول الويب ولوحة الإدارة سابقًا).
      if (data['requires2FA'] == true) {
        setState(() => _pendingToken = data['pendingToken'] as String?);
        return;
      }
      await ref.read(authControllerProvider.notifier).signIn(
            accessToken: data['accessToken'] as String,
            refreshToken: data['refreshToken'] as String?,
          );
      if (mounted) context.go('/profile');
    } catch (_) {
      setState(() => _error = 'فشل تسجيل الدخول — تحقق من البريد وكلمة المرور');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit2FA() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient().post<Map<String, dynamic>>('/auth/2fa/verify', data: {
        'pendingToken': _pendingToken,
        'code': _codeController.text.trim(),
      });
      final data = res.data ?? {};
      await ref.read(authControllerProvider.notifier).signIn(
            accessToken: data['accessToken'] as String,
            refreshToken: data['refreshToken'] as String?,
          );
      if (mounted) context.go('/profile');
    } catch (_) {
      setState(() => _error = 'رمز التحقق غير صحيح أو منتهي الصلاحية');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: kCream,
        appBar: AppBar(title: Text(_pendingToken != null ? 'التحقق الثنائي' : 'تسجيل الدخول')),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: _pendingToken != null ? _build2FAForm() : _buildLoginForm(),
        ),
      ),
    );
  }

  Widget _buildLoginForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _emailController,
          decoration: const InputDecoration(labelText: 'البريد الإلكتروني', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _passwordController,
          obscureText: true,
          decoration: const InputDecoration(labelText: 'كلمة المرور', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 20),
        if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: _loading ? null : _submitLogin,
          style: FilledButton.styleFrom(backgroundColor: kGold),
          child: _loading ? const CircularProgressIndicator() : const Text('دخول'),
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: () => context.push('/register'),
          child: const Text('لا تملك حسابًا؟ أنشئ حسابًا جديدًا'),
        ),
      ],
    );
  }

  Widget _build2FAForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('أدخل رمز التحقق من تطبيق المصادقة'),
        const SizedBox(height: 12),
        TextField(
          controller: _codeController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          decoration: const InputDecoration(labelText: 'رمز التحقق', border: OutlineInputBorder()),
        ),
        if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
        FilledButton(
          onPressed: _loading ? null : _submit2FA,
          style: FilledButton.styleFrom(backgroundColor: kGold),
          child: _loading ? const CircularProgressIndicator() : const Text('تأكيد'),
        ),
      ],
    );
  }
}
