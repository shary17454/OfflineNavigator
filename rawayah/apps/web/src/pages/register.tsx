import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { post, setToken } from '../lib/http';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const data = await post<{ accessToken: string }>('/auth/register', { email, displayName, password }, false);
      setToken(data.accessToken);
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء الحساب');
    }
  };

  return (
    <main className="home">
      <h1>إنشاء حساب جديد</h1>
      <form onSubmit={submit}>
        <label>
          الاسم
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>
          البريد الإلكتروني
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          كلمة المرور (8 أحرف على الأقل)
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit">إنشاء الحساب</button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </main>
  );
}
