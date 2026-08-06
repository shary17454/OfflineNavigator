import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { post, setToken } from '../lib/http';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [error, setError] = useState('');

  const submitLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const data = await post<{ requires2FA?: boolean; pendingToken?: string; accessToken?: string }>(
        '/auth/login',
        { email, password },
        false,
      );
      if (data.requires2FA && data.pendingToken) {
        setPendingToken(data.pendingToken);
        return;
      }
      if (data.accessToken) {
        setToken(data.accessToken);
        router.push('/account');
      }
    } catch {
      setError('فشل تسجيل الدخول — تحقق من البريد وكلمة المرور');
    }
  };

  const submit2FA = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const data = await post<{ accessToken: string }>('/auth/2fa/verify', { pendingToken, code }, false);
      setToken(data.accessToken);
      router.push('/account');
    } catch {
      setError('رمز التحقق غير صحيح أو منتهي الصلاحية');
    }
  };

  if (pendingToken) {
    return (
      <main className="home">
        <h1>التحقق الثنائي</h1>
        <form onSubmit={submit2FA}>
          <label>
            رمز التحقق
            <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
          </label>
          <button type="submit">تأكيد</button>
        </form>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </main>
    );
  }

  return (
    <main className="home">
      <h1>تسجيل الدخول</h1>
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
      <p>لا تملك حسابًا؟ <Link href="/register">أنشئ حسابًا جديدًا</Link></p>
    </main>
  );
}
