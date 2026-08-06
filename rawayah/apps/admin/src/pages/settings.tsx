import { useEffect, useState } from 'react';

type AppSetting = { id: string; key: string; value: unknown; scope: string; updatedAt: string };

export default function SettingsAdmin() {
  const [token, setToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [scope, setScope] = useState('global');
  const [message, setMessage] = useState('');

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const authHeaders = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

  const load = async (t: string) => {
    const res = await fetch(`${api}/settings`, { headers: authHeaders(t) });
    if (res.ok) setSettings(await res.json());
  };

  useEffect(() => {
    const t = localStorage.getItem('admin_access_token');
    if (!t) return;
    setToken(t);
    load(t);
  }, []);

  const submit = async () => {
    if (!token || !key) return;
    let parsedValue: unknown = value;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      // ليست JSON صالحة — تُحفظ كنص خام كما هي (يسمح بقيم نصية بسيطة دون تنسيق JSON)
    }
    const res = await fetch(`${api}/settings`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ key, value: parsedValue, scope }),
    });
    setMessage(res.ok ? 'تم الحفظ' : 'فشل الحفظ');
    setKey('');
    setValue('');
    await load(token);
  };

  return (
    <main className="admin-shell">
      <h1>إعدادات النظام</h1>

      <section>
        <h2>إضافة/تعديل إعداد</h2>
        <input placeholder="المفتاح (مثال: site.title)" value={key} onChange={(e) => setKey(e.target.value)} />
        <input placeholder='القيمة (نص أو JSON، مثال: "موروث" أو true أو 5)' value={value} onChange={(e) => setValue(e.target.value)} />
        <input placeholder="النطاق (افتراضيًا global)" value={scope} onChange={(e) => setScope(e.target.value)} />
        <button onClick={submit}>حفظ</button>
        {message && <p>{message}</p>}
      </section>

      <section>
        <h2>الإعدادات الحالية</h2>
        <ul>
          {settings.map((s) => (
            <li key={s.id}>
              <strong>{s.key}</strong> ({s.scope}) = {JSON.stringify(s.value)}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
