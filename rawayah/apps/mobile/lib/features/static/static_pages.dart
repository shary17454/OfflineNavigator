import 'package:flutter/material.dart';

import '../../core/theme.dart';

class _StaticScaffold extends StatelessWidget {
  const _StaticScaffold({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: kCream,
        appBar: AppBar(title: Text(title)),
        body: ListView(padding: const EdgeInsets.all(20), children: children),
      ),
    );
  }
}

Widget _section(String heading, String body) => Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(heading, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: kBrown)),
          const SizedBox(height: 6),
          Text(body, style: const TextStyle(height: 1.7)),
        ],
      ),
    );

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _StaticScaffold(
      title: 'عن التطبيق',
      children: [
        Text('موروث — ذاكرة التراث العربي', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: kBrown)),
        SizedBox(height: 12),
        Text(
          'منصة عربية رقمية لحفظ وتنظيم وعرض التراث العربي وتراث الجزيرة العربية والبادية: الشعر والشعراء، القصص '
          'التراثية، التاريخ والسير، الأماكن، الأمثال والمفردات، وموضوعات الخيل والإبل والصقارة. تربط القصيدة '
          'بقصتها، والرواية بمصدرها، وتعرض اختلاف الروايات بشفافية بدل حسم ما لا يمكن حسمه.',
          style: TextStyle(height: 1.7),
        ),
        SizedBox(height: 12),
        Text('كل مادة منشورة تمر بمراجعة وتحقق من المصدر قبل النشر — لا نشر تلقائي، ولا محتوى بلا مصدر.', style: TextStyle(height: 1.7)),
      ],
    );
  }
}

class PrivacyPage extends StatelessWidget {
  const PrivacyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return _StaticScaffold(
      title: 'سياسة الخصوصية',
      children: [
        _section(
          'البيانات التي نجمعها',
          'البريد الإلكتروني وكلمة المرور (مُشفَّرة، لا تُخزَّن كنص صريح أبدًا)، الاسم الظاهر، وأي محتوى تُنشئه بنفسك '
              'على المنصة (مفضلة، متابعات، أسئلة، إجابات، تعليقات، اقتراحات، بلاغات).',
        ),
        _section(
          'حقك في حذف بياناتك',
          'من صفحة "حسابي" يمكنك تصدير نسخة من بياناتك أو حذف حسابك نهائيًا — حذف فعلي لا شكلي، ينزع بريدك وكلمة '
              'مرورك الحقيقيين بشكل غير قابل للاسترجاع.',
        ),
        _section('من يرى بياناتك', 'لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث لأغراض تسويقية.'),
        _section('ملاحظة', 'هذه المنصة في مرحلة تطوير مبكرة (MVP). ستُحدَّث هذه السياسة كلما تغيّرت الممارسات الفعلية للمنصة.'),
      ],
    );
  }
}

class TermsPage extends StatelessWidget {
  const TermsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return _StaticScaffold(
      title: 'شروط الاستخدام',
      children: [
        _section(
          'طبيعة المحتوى',
          'كل مادة تراثية منشورة تحمل مصدرًا موثَّقًا. المحتوى المختلف حوله الروايات يُوسم صراحة، ولا يُقدَّم كحقيقة '
              'مطلقة.',
        ),
        _section(
          'مسؤوليتك كمستخدم',
          'إضافة المحتوى الرسمي محصورة بمالك المنصة بعد مراجعة وتحقق. المستخدم العادي يمكنه التصفح والبحث والحفظ '
              'والمتابعة، واقتراح تصحيح أو مصدر، أو الإبلاغ عن خطأ — لا نشر محتوى مباشر.',
        ),
        _section('الملكية الفكرية', 'لا يُنشر أي محتوى محمي بحقوق نشر غير واضحة الترخيص.'),
      ],
    );
  }
}

class ContactPage extends StatelessWidget {
  const ContactPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _StaticScaffold(
      title: 'تواصل معنا',
      children: [
        Text('لا توجد قناة دعم منفصلة بعد. لأي استفسار أو ملاحظة أو تصحيح، استخدم قسم "الأسئلة" — يصل مباشرة لفريق المراجعة.'),
        SizedBox(height: 8),
        Text('للإبلاغ عن خطأ في محتوى محدد، استخدم زر الإبلاغ المتاح على صفحة المحتوى نفسه.'),
      ],
    );
  }
}
