import { useEffect, useState } from 'react';

type RightsRecord = {
  id: string;
  contentType: string;
  contentId: string;
  status: string;
  licenseName?: string | null;
  note?: string | null;
  updatedAt: string;
};

const STATUSES = ['UNKNOWN', 'UNDER_REVIEW', 'PUBLIC_DOMAIN', 'LICENSED', 'PERMISSION_GRANTED', 'RESTRICTED', 'EXPIRED', 'TAKEDOWN_REQUESTED'];

export default function RightsAdmin() {
  const [token, setToken] = useState<string | null>(null);
  const [records, setRecords] = useState<RightsRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [contentType, setContentType] = useState('POEM');
  const [contentId, setContentId] = useState('');
  const [status, setStatus] = useState('UNDER_REVIEW');
  const [licenseName, setLicenseName] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const authHeaders = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

  const load = async (t: string, s?: string) => {
    const qs = s ? `?status=${s}` : '';
    const res = await fetch(`${api}/rights${qs}`, { headers: authHeaders(t) });
    if (res.ok) setRecords(await res.json());
  };

  useEffect(() => {
    const t = localStorage.getItem('admin_access_token');
    if (!t) return;
    setToken(t);
    load(t);
  }, []);

  const submit = async () => {
    if (!token || !contentId) return;
    const res = await fetch(`${api}/rights/${contentType}/${contentId}`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ status, licenseName: licenseName || undefined, note: note || undefined }),
    });
    setMessage(res.ok ? 'تم حفظ سجل الحقوق' : 'فشل الحفظ');
    await load(token, filterStatus || undefined);
  };

  return (
    <main className="admin-shell">
      <h1>إدارة الحقوق</h1>
      <p>لا يُنشر أي محتوى مرتبط بوسائط قبل تسجيل حالة حقوق واضحة هنا (لا UNKNOWN ولا RESTRICTED ولا EXPIRED).</p>

      <section>
        <h2>تسجيل/تحديث سجل حقوق</h2>
        <input placeholder="نوع المحتوى (مثال: POEM)" value={contentType} onChange={(e) => setContentType(e.target.value)} />
        <input placeholder="معرّف المحتوى" value={contentId} onChange={(e) => setContentId(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input placeholder="اسم الترخيص (اختياري)" value={licenseName} onChange={(e) => setLicenseName(e.target.value)} />
        <input placeholder="ملاحظة (اختياري)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button onClick={submit}>حفظ</button>
        {message && <p>{message}</p>}
      </section>

      <section>
        <h2>السجلات الحالية</h2>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            if (token) load(token, e.target.value || undefined);
          }}
        >
          <option value="">كل الحالات</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <ul>
          {records.map((r) => (
            <li key={r.id}>
              {r.contentType}/{r.contentId} — <strong>{r.status}</strong>
              {r.licenseName ? ` — ${r.licenseName}` : ''}
              {r.note ? ` — ${r.note}` : ''}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
