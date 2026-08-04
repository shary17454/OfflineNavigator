import { useEffect, useState } from 'react';

type PoetMini = { fullName: string };
type Poem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  poet?: PoetMini;
  createdAt: string;
};

export default function AdminContent() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const load = async () => {
    const t = localStorage.getItem('admin_access_token');
    if (!t) return;
    setToken(t);
    const res = await fetch(`${api}/poems/admin/all`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.ok) setPoems(await res.json());
  };

  const actionPayload = (path: string, actionName: string) =>
    path.includes('/publish')
      ? { note: 'نشر إداري' }
      : { action: actionName, note: 'إجراء إداري' };

  const action = async (id: string, path: string, actionName: string) => {
    if (!token) return;
    const loadingKey = path.includes('/publish') ? `${id}-publish` : `${id}-review`;
    setActionLoading(loadingKey);
    await fetch(`${api}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(actionPayload(path, actionName)),
    });
    await load();
    setActionLoading(null);
  };

  const review = (id: string, actionName: string) => action(id, `/poems/${id}/review`, actionName);
  const publish = (id: string) => action(id, `/poems/${id}/publish`, 'publish');

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="admin-shell">
      <h1>إدارة المحتوى</h1>
      <ul>
        {poems.map((p) => (
          <li key={p.id} style={{ marginBottom: 12 }}>
            <div>
              <strong>{p.title}</strong> ({p.slug}) - {p.status}
            </div>
            <div>{p.poet?.fullName || 'غير محدد'}</div>
            <button onClick={() => review(p.id, 'approve')} disabled={actionLoading === `${p.id}-review`}>
              اعتماد
            </button>
            <button onClick={() => review(p.id, 'request_revision')} disabled={actionLoading === `${p.id}-review`}>
              يحتاج تعديل
            </button>
            <button onClick={() => review(p.id, 'reject')} disabled={actionLoading === `${p.id}-review`}>
              رفض
            </button>
            <button onClick={() => publish(p.id)} disabled={actionLoading === `${p.id}-publish`}>
              نشر
            </button>
          </li>
        ))}
      </ul>
      {poems.length === 0 ? <p>لا يوجد محتوى.</p> : null}
    </main>
  );
}
