import { FormEvent, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${api}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError('فشل تسجيل الدخول — تحقق من البريد وكلمة المرور');
        return;
      }

      const data = await res.json();
      // حساب OWNER يمر إلزاميًا بخطوة تحقق ثنائي (2FA) قبل صدور أي رمز وصول
      // كامل — لا يكفي التحقق من وجود accessToken وحده كما كان الكود سابقًا.
      if (data.requires2FA) {
        setPendingToken(data.pendingToken);
        return;
      }

      localStorage.setItem('admin_access_token', data.accessToken);
      setSuccess('تم تسجيل الدخول بنجاح.');
    } catch {
      setError('خطأ في الاتصال بالخادم');
    }
  };

  const submit2FA = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${api}/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingToken, code }),
      });

      if (!res.ok) {
        setError('رمز التحقق غير صحيح أو منتهي الصلاحية');
        return;
      }

      const data = await res.json();
      localStorage.setItem('admin_access_token', data.accessToken);
      setSuccess('تم تسجيل الدخول بنجاح.');
      setPendingToken('');
    } catch {
      setError('خطأ في الاتصال بالخادم');
    }
  };

  if (pendingToken) {
    return (
      <main className="admin-shell">
        <h1>التحقق الثنائي</h1>
        <p>أدخل رمز التحقق من تطبيق المصادقة (Google Authenticator / Authy).</p>
        <form onSubmit={submit2FA}>
          <label>
            رمز التحقق
            <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
          </label>
          <button type="submit">تأكيد</button>
        </form>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <h1>تسجيل الدخول للإدارة</h1>
      <form onSubmit={submitLogin}>
        <label>
          البريد الإلكتروني
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          كلمة المرور
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit">دخول</button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </main>
  );
}
