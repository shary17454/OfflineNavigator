import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { API_URL, clearToken, get, getToken, headers, post } from '../lib/http';

type Me = {
  id: string;
  email: string;
  status: string;
  profile?: { displayName?: string | null } | null;
};

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    get<Me>('/users/me', true)
      .then(setMe)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const logout = () => {
    clearToken();
    router.push('/');
  };

  const exportData = async () => {
    const token = getToken();
    const res = await fetch(`${API_URL}/auth/account/export`, { headers: headers(token) });
    if (!res.ok) {
      setMessage('فشل تصدير البيانات');
      return;
    }
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-rawaya-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = async () => {
    if (!password) {
      setMessage('يجب إدخال كلمة المرور لتأكيد الحذف');
      return;
    }
    try {
      await post('/auth/account/delete', { password });
      clearToken();
      router.push('/');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'فشل حذف الحساب');
    }
  };

  if (loading) return <main className="home"><p>تحميل...</p></main>;
  if (!me) return null;

  return (
    <main className="home">
      <h1>حسابي</h1>
      <p>الاسم: {me.profile?.displayName || 'بدون اسم'}</p>
      <p>البريد الإلكتروني: {me.email}</p>
      <button onClick={logout}>تسجيل الخروج</button>

      <section>
        <h2>تصدير بياناتي</h2>
        <p>تنزيل نسخة من كل بياناتك الشخصية على المنصة (المفضلة، المتابعات، الأسئلة، الإجابات، التعليقات...).</p>
        <button onClick={exportData}>تصدير بياناتي</button>
      </section>

      <section>
        <h2>حذف الحساب</h2>
        <p>عملية نهائية: يُحذف كل ما هو تفضيل شخصي فعليًا، وتُنزع هويتك عن بريدك وكلمة مرورك بشكل غير قابل للاسترجاع.</p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}>حذف حسابي</button>
        ) : (
          <>
            <label>
              أدخل كلمة المرور للتأكيد
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button onClick={deleteAccount}>تأكيد الحذف النهائي</button>
            <button onClick={() => setConfirmDelete(false)}>إلغاء</button>
          </>
        )}
      </section>

      {message && <p style={{ color: 'crimson' }}>{message}</p>}
    </main>
  );
}
