import Link from 'next/link';

export default function AdminHome() {
  return (
    <main className="admin-shell">
      <h1>لوحة إدارة رواية</h1>
      <section>
        <h2>المراجعات العاجلة</h2>
        <Link href="/users">المستخدمون</Link> |
        <Link href="/content">المحتوى</Link> |
        <Link href="/ingestion">الاستيراد والمراجعة</Link> |
        <Link href="/suggestions">اقتراحات المستخدمين</Link> |
        <Link href="/sources">المصادر</Link> |
        <Link href="/rights">الحقوق</Link> |
        <Link href="/relations">العلاقات</Link> |
        <Link href="/settings">الإعدادات</Link> |
        <Link href="/analytics">التحليلات</Link> |
        <Link href="/backups">النسخ الاحتياطية</Link> |
        <Link href="/logs">سجل المراجعة</Link> |
        <Link href="/login">تسجيل دخول الإدارة</Link>
      </section>
      <p>واجهة الإدارة جاهزة كبداية MVP لإدارة المراجعة والنشر والصلاحيات الأساسية.</p>
    </main>
  );
}
