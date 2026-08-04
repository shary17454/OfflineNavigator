export default function AdminHome() {
  return (
    <main className="admin-shell">
      <h1>لوحة إدارة رواية</h1>
      <section>
        <h2>المراجعات العاجلة</h2>
        <a href="/users">المستخدمون</a> |
        <a href="/content">المحتوى</a> |
        <a href="/logs">سجل المراجعة</a> |
        <a href="/login">تسجيل دخول الإدارة</a>
      </section>
      <p>واجهة الإدارة جاهزة كبداية MVP لإدارة المراجعة والنشر والصلاحيات الأساسية.</p>
    </main>
  );
}
