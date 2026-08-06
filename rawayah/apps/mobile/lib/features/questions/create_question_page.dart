import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

class CreateQuestionPage extends StatefulWidget {
  const CreateQuestionPage({super.key});

  @override
  State<CreateQuestionPage> createState() => _CreateQuestionPageState();
}

class _CreateQuestionPageState extends State<CreateQuestionPage> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _category = 'عام';
  bool _sending = false;
  String? _error;

  Future<void> _submit() async {
    if (_titleController.text.trim().isEmpty || _descriptionController.text.trim().isEmpty) {
      setState(() => _error = 'يجب تعبئة العنوان والوصف');
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      final res = await ApiClient().post<Map<String, dynamic>>('/questions', data: {
        'title': _titleController.text.trim(),
        'category': _category,
        'description': _descriptionController.text.trim(),
      });
      if (mounted) context.pushReplacement('/questions/${res.data?['id']}');
    } catch (_) {
      setState(() => _error = 'تعذّر إرسال السؤال — تأكد من تسجيل الدخول');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: kCream,
        appBar: AppBar(title: const Text('طرح سؤال جديد')),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'عنوان السؤال', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _category,
                decoration: const InputDecoration(labelText: 'التصنيف', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'عام', child: Text('عام')),
                  DropdownMenuItem(value: 'شعر', child: Text('شعر')),
                  DropdownMenuItem(value: 'تاريخ', child: Text('تاريخ')),
                  DropdownMenuItem(value: 'أنساب', child: Text('أنساب')),
                ],
                onChanged: (v) => setState(() => _category = v ?? _category),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _descriptionController,
                maxLines: 5,
                decoration: const InputDecoration(labelText: 'تفاصيل السؤال', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 20),
              if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
              FilledButton(
                onPressed: _sending ? null : _submit,
                style: FilledButton.styleFrom(backgroundColor: kGold),
                child: _sending ? const CircularProgressIndicator() : const Text('إرسال السؤال'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
