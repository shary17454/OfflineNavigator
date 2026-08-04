import { FormEvent, useState } from 'react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError('فشل تسجيل الدخول');
        return;
      }

      const data = (await res.json()) as { accessToken: string };
      localStorage.setItem('admin_access_token', data.accessToken);
      setToken(data.accessToken);
      setError('');
    } catch {
      setError('خطأ في الاتصال');
    }
  };

  return (
    <main className="admin-shell">
      <h1>تسجيل الدخول للإدارة</h1>
      <form onSubmit={submit}>
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
      <p style={{ color: error ? 'crimson' : 'green' }}>{error || (token ? 'تم تسجيل الدخول بنجاح.' : '')}</p>
    </main>
  );
}
