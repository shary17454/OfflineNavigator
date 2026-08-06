import 'package:flutter/material.dart';

import 'api_client.dart';
import 'theme.dart';

/// ورقة سفلية عامة لثلاث إجراءات تفاعلية على أي عنصر محتوى: الإبلاغ عن
/// خطأ، اقتراح تصحيح، أو اقتراح مصدر — كلها تتطلب تسجيل الدخول (يعالجها
/// الخادم برسالة 401 إن لم يكن كذلك).
Future<void> showFeedbackSheet(BuildContext context, {required String contentType, required String contentId}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (context) => Directionality(
      textDirection: TextDirection.rtl,
      child: _FeedbackSheet(contentType: contentType, contentId: contentId),
    ),
  );
}

class _FeedbackSheet extends StatefulWidget {
  const _FeedbackSheet({required this.contentType, required this.contentId});

  final String contentType;
  final String contentId;

  @override
  State<_FeedbackSheet> createState() => _FeedbackSheetState();
}

enum _Mode { menu, report, correction, source }

class _FeedbackSheetState extends State<_FeedbackSheet> {
  _Mode _mode = _Mode.menu;
  final _textController = TextEditingController();
  bool _sending = false;
  String? _message;

  Future<void> _submitReport() async {
    setState(() => _sending = true);
    try {
      await ApiClient().post('/reports', data: {
        'contentType': widget.contentType,
        'contentId': widget.contentId,
        'reason': _textController.text.trim().isEmpty ? 'محتوى بحاجة لمراجعة' : _textController.text.trim(),
      });
      setState(() => _message = 'تم إرسال البلاغ، شكرًا لمساعدتك');
    } catch (_) {
      setState(() => _message = 'تعذّر الإرسال — تأكد من تسجيل الدخول');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _submitSuggestion(String type) async {
    if (_textController.text.trim().isEmpty) {
      setState(() => _message = 'يجب كتابة التفاصيل أولًا');
      return;
    }
    setState(() => _sending = true);
    try {
      await ApiClient().post('/suggestions', data: {
        'suggestionType': type,
        'contentType': widget.contentType,
        'contentId': widget.contentId,
        'title': type == 'CORRECTION' ? 'اقتراح تصحيح' : 'اقتراح مصدر',
        'body': _textController.text.trim(),
      });
      setState(() => _message = 'تم إرسال اقتراحك، سيراجعه فريق المحتوى');
    } catch (_) {
      setState(() => _message = 'تعذّر الإرسال — تأكد من تسجيل الدخول');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 20, right: 20, top: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_message != null) ...[
            Text(_message!, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton(onPressed: () => Navigator.pop(context), child: const Text('إغلاق')),
          ] else if (_mode == _Mode.menu) ...[
            ListTile(leading: const Icon(Icons.flag_outlined), title: const Text('الإبلاغ عن خطأ'), onTap: () => setState(() => _mode = _Mode.report)),
            ListTile(leading: const Icon(Icons.edit_outlined), title: const Text('اقتراح تصحيح'), onTap: () => setState(() => _mode = _Mode.correction)),
            ListTile(leading: const Icon(Icons.source_outlined), title: const Text('اقتراح مصدر'), onTap: () => setState(() => _mode = _Mode.source)),
          ] else ...[
            TextField(
              controller: _textController,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: _mode == _Mode.report ? 'سبب الإبلاغ' : 'التفاصيل',
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _sending
                  ? null
                  : _mode == _Mode.report
                      ? _submitReport
                      : () => _submitSuggestion(_mode == _Mode.correction ? 'CORRECTION' : 'NEW_SOURCE'),
              style: FilledButton.styleFrom(backgroundColor: kGold),
              child: _sending ? const CircularProgressIndicator() : const Text('إرسال'),
            ),
            const SizedBox(height: 20),
          ],
        ],
      ),
    );
  }
}
