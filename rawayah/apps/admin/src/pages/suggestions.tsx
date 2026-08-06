import { useEffect, useState } from 'react';

type Suggestion = {
  id: string;
  suggestionType: string;
  contentType?: string | null;
  contentId?: string | null;
  title: string;
  body: string;
  submittedBy?: { profile?: { displayName?: string | null } | null; email: string };
  createdAt: string;
};

export default function SuggestionsAdmin() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const load = async () => {
    const t = localStorage.getItem('admin_access_token');
    if (!t) return;
    setToken(t);
    const res = await fetch(`${api}/suggestions`, { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (!token) return;
    await fetch(`${api}/suggestions/${id}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  return (
    <main className="admin-shell">
      <h1>صندوق اقتراحات المستخدمين</h1>
      <ul>
        {items.map((s) => (
          <li key={s.id} style={{ marginBottom: 12 }}>
            <div>
              <strong>{s.title}</strong> ({s.suggestionType}) {s.contentType ? `— بخصوص ${s.contentType}` : ''}
            </div>
            <div>{s.body}</div>
            <div>من: {s.submittedBy?.profile?.displayName || s.submittedBy?.email}</div>
            <button onClick={() => review(s.id, 'ACCEPTED')}>قبول</button>
            <button onClick={() => review(s.id, 'REJECTED')}>رفض</button>
          </li>
        ))}
      </ul>
      {items.length === 0 ? <p>لا توجد اقتراحات قيد المراجعة.</p> : null}
    </main>
  );
}
