import { useEffect, useState } from 'react';

type Source = {
  id: string;
  title: string;
  author?: string | null;
  sourceType: string;
  tier?: number | null;
  tierReason?: string | null;
  isActive: boolean;
};

export default function SourcesAdmin() {
  const [token, setToken] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState('كتاب محقق');
  const [tier, setTier] = useState('2');

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const authHeaders = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

  const load = async (t: string) => {
    const res = await fetch(`${api}/sources`, { headers: authHeaders(t) });
    if (res.ok) setSources(await res.json());
  };

  useEffect(() => {
    const t = localStorage.getItem('admin_access_token');
    if (!t) return;
    setToken(t);
    load(t);
  }, []);

  const createSource = async () => {
    if (!token || !title) return;
    await fetch(`${api}/sources`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ title, sourceType, tier: Number(tier) }),
    });
    setTitle('');
    await load(token);
  };

  const toggleActive = async (s: Source) => {
    if (!token) return;
    await fetch(`${api}/sources/${s.id}/${s.isActive ? 'deactivate' : 'activate'}`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    await load(token);
  };

  return (
    <main className="admin-shell">
      <h1>المصادر</h1>
      <p>مصادر الاستشهاد والتوثيق (المستوى 1 وثائق أصلية — المستوى 5 منتديات/مجهول). لا يُنشر محتوى يعتمد على المستوى 5 فقط.</p>

      <section>
        <h2>إضافة مصدر</h2>
        <input placeholder="عنوان المصدر" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="نوع المصدر" value={sourceType} onChange={(e) => setSourceType(e.target.value)} />
        <select value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="1">المستوى 1 — وثيقة/مخطوطة أصلية</option>
          <option value="2">المستوى 2 — كتاب محقق/بحث محكّم</option>
          <option value="3">المستوى 3 — كتاب حديث بمراجع واضحة</option>
          <option value="4">المستوى 4 — صحف/مواقع موثوقة جزئيًا</option>
          <option value="5">المستوى 5 — منتديات/نصوص مجهولة</option>
        </select>
        <button onClick={createSource}>إضافة</button>
      </section>

      <section>
        <h2>كل المصادر</h2>
        <ul>
          {sources.map((s) => (
            <li key={s.id}>
              <strong>{s.title}</strong> — {s.sourceType} — المستوى {s.tier ?? '؟'} — {s.isActive ? 'فعّال ✅' : 'معطَّل ⛔'}
              {' '}
              <button onClick={() => toggleActive(s)}>{s.isActive ? 'تعطيل' : 'تفعيل'}</button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
