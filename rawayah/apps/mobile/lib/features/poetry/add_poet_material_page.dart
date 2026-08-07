import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

/// إضافة مادة إلى مكتبة شاعر — للمالك والرواة والمؤرخين المعتمدين.
///
/// المادة تُحفظ دائمًا كمسودة، ولا يوجد في هذه الشاشة أي حقل لتحديد
/// الحقوق أو النشر: الحقوق بيد المالك وحده، والنشر لا يتم من هنا مهما
/// كان دور المستخدم. هذا انعكاس لقاعدة مفروضة على الخادم لا مجرد تصميم.
class AddPoetMaterialPage extends StatefulWidget {
  const AddPoetMaterialPage({super.key, required this.poetId});

  final String poetId;

  @override
  State<AddPoetMaterialPage> createState() => _AddPoetMaterialPageState();
}

class _AddPoetMaterialPageState extends State<AddPoetMaterialPage> {
  final _formKey = GlobalKey<FormState>();

  String _kind = 'TEXT';
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _bodyText = TextEditingController();
  final _externalUrl = TextEditingController();
  final _occasion = TextEditingController();
  final _materialDate = TextEditingController();
  final _reciterName = TextEditingController();
  final _capturedByName = TextEditingController();
  final _sourceNotes = TextEditingController();
  final _rightsHolder = TextEditingController();

  String? _uploadedMediaUrl;
  String? _uploadedFileName;
  bool _uploading = false;
  bool _submitting = false;
  String? _message;
  bool _done = false;

  static const _kindLabels = {
    'TEXT': 'نص',
    'AUDIO': 'تسجيل صوتي',
    'VIDEO': 'مقطع مرئي',
    'IMAGE': 'صورة',
    'DOCUMENT': 'وثيقة (PDF)',
    'EXTERNAL_LINK': 'رابط خارجي',
  };

  static const _mediaKinds = ['AUDIO', 'VIDEO', 'IMAGE', 'DOCUMENT'];

  static const _allowedExtensions = {
    'AUDIO': ['mp3', 'wav', 'ogg'],
    'VIDEO': ['mp4', 'webm'],
    'IMAGE': ['jpg', 'jpeg', 'png', 'webp'],
    'DOCUMENT': ['pdf'],
  };

  @override
  void dispose() {
    for (final c in [
      _title,
      _description,
      _bodyText,
      _externalUrl,
      _occasion,
      _materialDate,
      _reciterName,
      _capturedByName,
      _sourceNotes,
      _rightsHolder,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickAndUpload() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: _allowedExtensions[_kind],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;

    final picked = result.files.first;
    final bytes = picked.bytes;
    if (bytes == null) {
      setState(() => _message = 'تعذّر قراءة الملف المحدد');
      return;
    }

    setState(() {
      _uploading = true;
      _message = null;
    });

    try {
      final form = FormData.fromMap({
        'kind': _kind,
        'file': MultipartFile.fromBytes(bytes, filename: picked.name),
      });
      final res = await ApiClient().post<Map<String, dynamic>>(
        '/poets/${widget.poetId}/library/upload',
        data: form,
      );
      setState(() {
        _uploadedMediaUrl = res.data?['mediaUrl']?.toString();
        _uploadedFileName = picked.name;
        _message = 'تم رفع الملف';
      });
    } on DioException catch (e) {
      final serverMessage = (e.response?.data is Map) ? (e.response!.data as Map)['message'] : null;
      setState(() => _message = serverMessage?.toString() ?? 'تعذّر رفع الملف');
    } catch (_) {
      setState(() => _message = 'تعذّر رفع الملف');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_mediaKinds.contains(_kind) && _uploadedMediaUrl == null) {
      setState(() => _message = 'يجب رفع الملف أولًا');
      return;
    }

    setState(() {
      _submitting = true;
      _message = null;
    });

    try {
      await ApiClient().post('/poets/${widget.poetId}/library/items', data: {
        'kind': _kind,
        'title': _title.text.trim(),
        if (_description.text.trim().isNotEmpty) 'description': _description.text.trim(),
        if (_kind == 'TEXT') 'bodyText': _bodyText.text.trim(),
        if (_kind == 'EXTERNAL_LINK') 'externalUrl': _externalUrl.text.trim(),
        if (_uploadedMediaUrl != null) 'mediaUrl': _uploadedMediaUrl,
        if (_occasion.text.trim().isNotEmpty) 'occasion': _occasion.text.trim(),
        if (_materialDate.text.trim().isNotEmpty) 'materialDate': _materialDate.text.trim(),
        if (_reciterName.text.trim().isNotEmpty) 'reciterName': _reciterName.text.trim(),
        if (_capturedByName.text.trim().isNotEmpty) 'capturedByName': _capturedByName.text.trim(),
        if (_sourceNotes.text.trim().isNotEmpty) 'sourceNotes': _sourceNotes.text.trim(),
        if (_rightsHolder.text.trim().isNotEmpty) 'rightsHolder': _rightsHolder.text.trim(),
      });
      if (!mounted) return;
      setState(() {
        _done = true;
        _message = 'حُفظت المادة كمسودة. أرسلها للمراجعة من صفحة «مساهماتي».';
      });
    } on DioException catch (e) {
      final serverMessage = (e.response?.data is Map) ? (e.response!.data as Map)['message'] : null;
      setState(() => _message = serverMessage?.toString() ?? 'تعذّر حفظ المادة');
    } catch (_) {
      setState(() => _message = 'تعذّر حفظ المادة');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMedia = _mediaKinds.contains(_kind);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.rawaya.background,
        appBar: AppBar(title: const Text('إضافة مادة')),
        body: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: context.rawaya.warningSurface,
                  border: Border.all(color: context.rawaya.gold),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'تُحفظ المادة كمسودة ثم تُرسل للمراجعة. لا تُنشر إلا بعد اعتماد المالك '
                  'وتحديد حالة حقوقها. لا تَرفع مادة لا تملك حق نشرها.',
                  style: TextStyle(fontSize: 12, color: context.rawaya.textPrimary, height: 1.6),
                ),
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                initialValue: _kind,
                decoration: const InputDecoration(labelText: 'نوع المادة'),
                items: [
                  for (final entry in _kindLabels.entries)
                    DropdownMenuItem(value: entry.key, child: Text(entry.value)),
                ],
                onChanged: (value) {
                  if (value == null) return;
                  setState(() {
                    _kind = value;
                    // تغيير النوع يبطل الملف المرفوع لأن قيوده تختلف.
                    _uploadedMediaUrl = null;
                    _uploadedFileName = null;
                  });
                },
              ),
              const SizedBox(height: 12),

              _field(_title, 'العنوان', required: true, minLength: 2),
              _field(_description, 'الوصف', maxLines: 2),

              if (_kind == 'TEXT') _field(_bodyText, 'نص المادة', required: true, maxLines: 6),
              if (_kind == 'EXTERNAL_LINK') _field(_externalUrl, 'الرابط الخارجي', required: true),

              if (isMedia) ...[
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: _uploading ? null : _pickAndUpload,
                  icon: const Icon(Icons.upload_file),
                  label: Text(_uploading ? 'جارٍ الرفع…' : 'اختيار ورفع الملف'),
                ),
                if (_uploadedFileName != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Row(
                      children: [
                        Icon(Icons.check_circle, color: context.rawaya.success, size: 18),
                        const SizedBox(width: 6),
                        Expanded(child: Text(_uploadedFileName!, style: const TextStyle(fontSize: 13))),
                      ],
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    'الصيغ المسموحة: ${(_allowedExtensions[_kind] ?? const []).join('، ')}',
                    style: TextStyle(fontSize: 12, color: context.rawaya.textSecondary),
                  ),
                ),
              ],

              const SizedBox(height: 16),
              Text('تفاصيل التوثيق', style: TextStyle(fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
              const SizedBox(height: 8),
              _field(_occasion, 'المناسبة'),
              _field(_materialDate, 'التاريخ (إن وُجد)'),
              if (_kind == 'AUDIO' || _kind == 'VIDEO') _field(_reciterName, 'الراوي أو الملقي'),
              if (_kind == 'IMAGE' || _kind == 'VIDEO') _field(_capturedByName, 'المصور / صاحب التسجيل'),
              _field(_sourceNotes, 'المصدر أو ملاحظات عنه', maxLines: 2),
              _field(_rightsHolder, 'صاحب الحقوق (إن عُرف)'),

              if (_message != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    _message!,
                    style: TextStyle(
                      color: _message!.startsWith('تم') || _message!.startsWith('حُفظت')
                          ? context.rawaya.success
                          : context.rawaya.danger,
                    ),
                  ),
                ),

              const SizedBox(height: 12),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: context.rawaya.gold),
                onPressed: (_submitting || _done) ? null : _submit,
                child: Text(_submitting ? 'جارٍ الحفظ…' : 'حفظ كمسودة'),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool required = false,
    int maxLines = 1,
    int minLength = 0,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: required ? '$label *' : label),
        validator: (value) {
          final v = (value ?? '').trim();
          if (required && v.isEmpty) return 'هذا الحقل مطلوب';
          if (v.isNotEmpty && minLength > 0 && v.length < minLength) {
            return 'أدخل $minLength حرفًا على الأقل';
          }
          return null;
        },
      ),
    );
  }
}
