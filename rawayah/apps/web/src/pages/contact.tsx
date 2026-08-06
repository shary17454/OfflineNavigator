import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="home">
      <h1>تواصل معنا</h1>
      <p>
        لا توجد قناة دعم منفصلة بعد. لأي استفسار أو ملاحظة أو تصحيح، استخدم قسم{' '}
        <Link href="/questions">الأسئلة</Link> — يصل مباشرة لفريق المراجعة.
      </p>
      <p>للإبلاغ عن خطأ في محتوى محدد، استخدم زر الإبلاغ المتاح على صفحة المحتوى نفسه.</p>
    </main>
  );
}
