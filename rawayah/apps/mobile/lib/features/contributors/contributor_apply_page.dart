import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';

/// نموذج التقدم لعضوية راوٍ أو مؤرخ.
///
/// الفصل بين القسمين مقصود وظاهر للمستخدم: قسم يُنشر علنًا بعد القبول،
/// وقسم للتحقق فقط لا يظهر للعامة إطلاقًا. وخانتا الموافقة تبدآن
/// فارغتين دائمًا — لا تحديد مسبق.
class ContributorApplyPage extends StatefulWidget {
  const ContributorApplyPage({super.key});

  @override
  State<ContributorApplyPage> createState() => _ContributorApplyPageState();
}

class _ContributorApplyPageState extends State<ContributorApplyPage> {
  final _formKey = GlobalKey<FormState>();

  String _type = 'NARRATOR';

  final _publicDisplayName = TextEditingController();
  final _publicBio = TextEditingController();
  final _publicSpecialties = TextEditingController();
  final _publicCountry = TextEditingController();
  final _publicRegion = TextEditingController();

  final _privateFullName = TextEditingController();
  final _privateEmail = TextEditingController();
  final _privatePhone = TextEditingController();
  final _privateExperience = TextEditingController();
  final _privateKnowledgeSources = TextEditingController();
  final _privateCredentials = TextEditingController();
  final _privatePublications = TextEditingController();

  bool _reliesOnOral = false;
  bool _hasRecordings = false;
  bool _hasDocuments = false;

  // تبدآن false دائمًا — متطلب صريح بعدم استخدام خانة محددة مسبقًا.
  bool _publicDisplayConsent = false;
  bool _agreementAccepted = false;

  String? _consentText;
  List<String> _scopes = const [];
  bool _loadingConsent = true;
  bool _submitting = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    _loadConsent();
  }

  @override
  void dispose() {
    for (final c in [
      _publicDisplayName,
      _publicBio,
      _publicSpecialties,
      _publicCountry,
      _publicRegion,
      _privateFullName,
      _privateEmail,
      _privatePhone,
      _privateExperience,
      _privateKnowledgeSources,
      _privateCredentials,
      _privatePublications,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadConsent() async {
    setState(() => _loadingConsent = true);
    try {
      final res = await ApiClient().get<Map<String, dynamic>>('/contributors/consent-preview?type=$_type');
      _consentText = res.data?['consentText']?.toString();
      _scopes = ((res.data?['grantedScopes'] as List?) ?? []).map((e) => e.toString()).toList();
    } catch (_) {
      _consentText = null;
    } finally {
      if (mounted) setState(() => _loadingConsent = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_publicDisplayConsent || !_agreementAccepted) {
      setState(() => _message = 'يجب الموافقة على ظهور بياناتك العامة وقبول اتفاقية المساهم');
      return;
    }

    setState(() {
      _submitting = true;
      _message = null;
    });

    try {
      await ApiClient().post('/contributors/apply', data: {
        'type': _type,
        'publicDisplayName': _publicDisplayName.text.trim(),
        'publicBio': _publicBio.text.trim(),
        'publicSpecialties': _publicSpecialties.text.trim(),
        if (_publicCountry.text.trim().isNotEmpty) 'publicCountry': _publicCountry.text.trim(),
        if (_publicRegion.text.trim().isNotEmpty) 'publicRegion': _publicRegion.text.trim(),
        'privateFullName': _privateFullName.text.trim(),
        'privateEmail': _privateEmail.text.trim(),
        if (_privatePhone.text.trim().isNotEmpty) 'privatePhoneNumber': _privatePhone.text.trim(),
        'privateExperience': _privateExperience.text.trim(),
        if (_privateKnowledgeSources.text.trim().isNotEmpty)
          'privateKnowledgeSources': _privateKnowledgeSources.text.trim(),
        if (_privateCredentials.text.trim().isNotEmpty) 'privateCredentials': _privateCredentials.text.trim(),
        if (_privatePublications.text.trim().isNotEmpty) 'privatePublications': _privatePublications.text.trim(),
        'privateReliesOnOralTradition': _reliesOnOral,
        'privateHasRecordings': _hasRecordings,
        'privateHasDocuments': _hasDocuments,
        'publicDisplayConsent': _publicDisplayConsent,
        'contributorAgreementAccepted': _agreementAccepted,
      });
      if (!mounted) return;
      setState(() => _message = 'تم إرسال طلبك بنجاح. سيصلك إشعار عند مراجعته.');
    } catch (e) {
      setState(() => _message = 'تعذّر إرسال الطلب. تأكد من تسجيل الدخول واكتمال الحقول المطلوبة.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.rawaya.background,
        appBar: AppBar(title: const Text('طلب عضوية مهنية')),
        body: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'NARRATOR', label: Text('راوٍ')),
                  ButtonSegment(value: 'HISTORIAN', label: Text('مؤرخ / باحث')),
                ],
                selected: {_type},
                onSelectionChanged: (s) {
                  setState(() {
                    _type = s.first;
                    // تغيير النوع يبطل الموافقة السابقة لأن نصها يختلف.
                    _publicDisplayConsent = false;
                  });
                  _loadConsent();
                },
              ),
              const SizedBox(height: 20),

              _sectionHeader(
                'بيانات تظهر للعامة بعد القبول',
                'هذه البيانات ستكون مرئية لزوار التطبيق.',
                Icons.public,
                context.rawaya.success,
              ),
              _field(_publicDisplayName, 'الاسم الذي تريد ظهوره للعامة', required: true),
              _field(_publicBio, 'نبذة عنك', required: true, maxLines: 3, minLength: 20),
              _field(_publicSpecialties, 'مجالات تخصصك', required: true),
              _field(_publicCountry, 'الدولة'),
              _field(_publicRegion, 'المنطقة العامة'),

              const SizedBox(height: 24),
              _sectionHeader(
                'بيانات للتحقق فقط — لا تُنشر للعامة',
                'تُستخدم للتحقق من صفتك ولا تظهر في أي صفحة عامة.',
                Icons.lock_outline,
                context.rawaya.warning,
              ),
              _field(_privateFullName, 'الاسم الكامل', required: true, minLength: 4),
              _field(_privateEmail, 'البريد الإلكتروني', required: true, email: true),
              _field(_privatePhone, 'رقم التواصل'),
              _field(_privateExperience, 'خبرتك', required: true, maxLines: 3, minLength: 10),
              _field(_privateKnowledgeSources, 'مصادر معرفتك', maxLines: 2),
              if (_type == 'HISTORIAN') ...[
                _field(_privateCredentials, 'المؤهلات', maxLines: 2),
                _field(_privatePublications, 'المؤلفات أو الأبحاث', maxLines: 2),
              ],

              if (_type == 'NARRATOR') ...[
                CheckboxListTile(
                  value: _reliesOnOral,
                  onChanged: (v) => setState(() => _reliesOnOral = v ?? false),
                  title: const Text('أعتمد على رواية شفهية'),
                ),
                CheckboxListTile(
                  value: _hasRecordings,
                  onChanged: (v) => setState(() => _hasRecordings = v ?? false),
                  title: const Text('لديّ تسجيلات'),
                ),
              ],
              CheckboxListTile(
                value: _hasDocuments,
                onChanged: (v) => setState(() => _hasDocuments = v ?? false),
                title: const Text('لديّ وثائق'),
              ),

              const SizedBox(height: 24),
              _sectionHeader('الموافقات المطلوبة', '', Icons.assignment_turned_in_outlined, context.rawaya.gold),

              if (_loadingConsent)
                const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()))
              else if (_consentText != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: context.rawaya.surface,
                    border: Border.all(color: context.rawaya.border),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _consentText!,
                        style: TextStyle(height: 1.7, fontSize: 13, color: context.rawaya.textPrimary),
                      ),
                      if (_scopes.isNotEmpty) ...[
                        const Divider(height: 20),
                        Text(
                          'البيانات المشمولة بالموافقة: ${_scopes.length} عنصرًا',
                          style: TextStyle(fontSize: 12, color: context.rawaya.textSecondary),
                        ),
                      ],
                    ],
                  ),
                ),

              CheckboxListTile(
                value: _publicDisplayConsent,
                onChanged: (v) => setState(() => _publicDisplayConsent = v ?? false),
                title: const Text('أوافق صراحةً على ظهور بيانات ملفي العام'),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              CheckboxListTile(
                value: _agreementAccepted,
                onChanged: (v) => setState(() => _agreementAccepted = v ?? false),
                title: const Text('أقرّ بقراءة اتفاقية المساهم وأقبلها'),
                subtitle: TextButton(
                  onPressed: () => context.push('/policies/CONTRIBUTOR_AGREEMENT'),
                  child: const Text('قراءة الاتفاقية'),
                ),
                controlAffinity: ListTileControlAffinity.leading,
              ),

              if (_message != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    _message!,
                    style: TextStyle(
                      color: _message!.startsWith('تم') ? context.rawaya.success : context.rawaya.danger,
                    ),
                  ),
                ),

              const SizedBox(height: 12),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: context.rawaya.gold),
                onPressed: _submitting ? null : _submit,
                child: Text(_submitting ? 'جارٍ الإرسال…' : 'إرسال الطلب'),
              ),
              const SizedBox(height: 8),
              Text(
                'ملاحظة: قبول العضوية يتيح لك إضافة المواد، وتبقى كل مادة قيد مراجعة المالك قبل نشرها.',
                style: TextStyle(fontSize: 12, color: context.rawaya.textSecondary),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionHeader(String title, String subtitle, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
              ),
            ],
          ),
          if (subtitle.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4, right: 26),
              child: Text(subtitle, style: TextStyle(fontSize: 12, color: context.rawaya.textSecondary)),
            ),
        ],
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool required = false,
    int maxLines = 1,
    int minLength = 0,
    bool email = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: required ? '$label *' : label,
        ),
        validator: (value) {
          final v = (value ?? '').trim();
          if (required && v.isEmpty) return 'هذا الحقل مطلوب';
          if (v.isNotEmpty && minLength > 0 && v.length < minLength) {
            return 'أدخل $minLength حرفًا على الأقل';
          }
          if (email && v.isNotEmpty && !v.contains('@')) return 'البريد الإلكتروني غير صحيح';
          return null;
        },
      ),
    );
  }
}
