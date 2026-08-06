import { useEffect, useState } from 'react';

type Relation = {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationType: string;
  label?: string | null;
  note?: string | null;
};

export default function RelationsAdmin() {
  const [token, setToken] = useState<string | null>(null);
  const [lookupType, setLookupType] = useState('POEM');
  const [lookupId, setLookupId] = useState('');
  const [relations, setRelations] = useState<Relation[]>([]);

  const [sourceType, setSourceType] = useState('POEM');
  const [sourceId, setSourceId] = useState('');
  const [targetType, setTargetType] = useState('POET');
  const [targetId, setTargetId] = useState('');
  const [relationType, setRelationType] = useState('شاعر');
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState('');

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const authHeaders = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

  useEffect(() => {
    setToken(localStorage.getItem('admin_access_token'));
  }, []);

  const lookup = async () => {
    if (!lookupId) return;
    const res = await fetch(`${api}/graph/${lookupType}/${lookupId}/relations`);
    if (res.ok) setRelations(await res.json());
  };

  const createRelation = async () => {
    if (!token || !sourceId || !targetId) return;
    const res = await fetch(`${api}/graph/relations`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ sourceType, sourceId, targetType, targetId, relationType, label: label || undefined }),
    });
    setMessage(res.ok ? 'تم إنشاء العلاقة' : 'فشل إنشاء العلاقة');
    if (res.ok && lookupId === sourceId) await lookup();
  };

  const deleteRelation = async (id: string) => {
    if (!token) return;
    await fetch(`${api}/graph/relations/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    await lookup();
  };

  return (
    <main className="admin-shell">
      <h1>شبكة العلاقات المعرفية</h1>
      <p>يربط النظام القصيدة بالشاعر، والقصة بالأشخاص، والمكان بالأحداث، وغيرها — كل علاقة موجَّهة ولها نوع ونص عرض.</p>

      <section>
        <h2>استعراض علاقات عنصر</h2>
        <input placeholder="نوع المحتوى (مثال: POEM)" value={lookupType} onChange={(e) => setLookupType(e.target.value)} />
        <input placeholder="معرّف العنصر" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
        <button onClick={lookup}>عرض العلاقات</button>
        <ul>
          {relations.map((r) => (
            <li key={r.id}>
              {r.sourceType}/{r.sourceId} — <strong>{r.relationType}</strong> ({r.label || 'بلا نص عرض'}) — {r.targetType}/{r.targetId}
              {' '}
              <button onClick={() => deleteRelation(r.id)}>حذف</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>إنشاء علاقة جديدة</h2>
        <input placeholder="نوع المصدر" value={sourceType} onChange={(e) => setSourceType(e.target.value)} />
        <input placeholder="معرّف المصدر" value={sourceId} onChange={(e) => setSourceId(e.target.value)} />
        <input placeholder="نوع الهدف" value={targetType} onChange={(e) => setTargetType(e.target.value)} />
        <input placeholder="معرّف الهدف" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
        <input placeholder="نوع العلاقة (مثال: شاعر، مدح، عاصر)" value={relationType} onChange={(e) => setRelationType(e.target.value)} />
        <input placeholder="نص العرض (اختياري)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <button onClick={createRelation}>إنشاء</button>
        {message && <p>{message}</p>}
      </section>
    </main>
  );
}
