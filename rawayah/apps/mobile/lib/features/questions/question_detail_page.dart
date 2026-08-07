import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/detail_page.dart';
import '../../core/theme.dart';

class QuestionDetailPage extends StatefulWidget {
  const QuestionDetailPage({super.key, required this.questionId});

  final String questionId;

  @override
  State<QuestionDetailPage> createState() => _QuestionDetailPageState();
}

class _QuestionDetailPageState extends State<QuestionDetailPage> {
  final _answerController = TextEditingController();
  bool _sending = false;
  String? _message;
  int _refreshKey = 0;

  Future<void> _sendAnswer() async {
    if (_answerController.text.trim().isEmpty) return;
    setState(() {
      _sending = true;
      _message = null;
    });
    try {
      await ApiClient().post('/questions/${widget.questionId}/answers', data: {'body': _answerController.text.trim()});
      _answerController.clear();
      setState(() => _refreshKey++);
    } catch (_) {
      setState(() => _message = 'تعذّر إرسال الإجابة — تأكد من تسجيل الدخول');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      key: ValueKey(_refreshKey),
      title: 'السؤال',
      endpoint: '/questions/${widget.questionId}',
      builder: (context, question) {
        final answers = (question['answers'] as List? ?? []).cast<Map<String, dynamic>>();
        return Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(question['title']?.toString() ?? '', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
                  const SizedBox(height: 8),
                  Text(question['description']?.toString() ?? ''),
                  const SizedBox(height: 20),
                  Text('الإجابات (${answers.length})', style: TextStyle(fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
                  const SizedBox(height: 8),
                  ...answers.map(
                    (a) => Card(
                      color: a['isOfficial'] == true ? Colors.amber.shade50 : null,
                      child: ListTile(
                        leading: Icon(a['isOfficial'] == true ? Icons.verified : Icons.person_outline),
                        title: Text(a['body']?.toString() ?? ''),
                        subtitle: a['isOfficial'] == true ? const Text('إجابة رسمية من المالك') : null,
                      ),
                    ),
                  ),
                  if (answers.isEmpty) const Text('لا توجد إجابات بعد'),
                ],
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _answerController,
                        decoration: const InputDecoration(hintText: 'اكتب إجابتك', border: OutlineInputBorder()),
                      ),
                    ),
                    IconButton(
                      onPressed: _sending ? null : _sendAnswer,
                      icon: Icon(Icons.send, color: context.rawaya.gold),
                    ),
                  ],
                ),
              ),
            ),
            if (_message != null) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(_message!, style: TextStyle(color: context.rawaya.danger))),
          ],
        );
      },
    );
  }
}
