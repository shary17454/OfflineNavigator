import { useEffect, useState } from 'react';

type Application = {
  id: string;
  type: string;
  status: string;
  publicDisplayName: string;
  publicBio: string;
  publicSpecialties: string;
  publicCountry?: string | null;
  publicRegion?: string | null;
  privateFullName: string;
  privateEmail: string;
  privatePhoneNumber?: string | null;
  privateExperience: string;
  privateKnowledgeSources?: string | null;
  privateCredentials?: string | null;
  privatePublications?: string | null;
  privateReliesOnOralTradition: boolean;
  privateHasRecordings: boolean;
  privateHasDocuments: boolean;
  submittedAt?: string | null;
  reviewNotes?: string | null;
  user?: { id: string; email: string };
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة',
  SUBMITTED: 'مُقدَّم',
  UNDER_REVIEW: 'قيد المراجعة',
  NEEDS_INFORMATION: 'مطلوب معلومات',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
  SUSPENDED: 'موقوف',
  REVOKED: 'مسحوب',
};

export default function ContributorsAdmin() {
  const [token, setToken] = useState<string | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState('SUBMITTED');
  const [selected, setSelected] = useState<Application | null>(null);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const authHeaders = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

  const load = async (t: string, status: string) => {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${api}/contributors/applications${query}`, { headers: authHeaders(t) });
    if (res.ok) setApps(await res.json());
    else setMessage('تعذّر تحميل الطلبات');
  };

  useEffect(() => {
    const t = localStorage.getItem('admin_access_token');
    if (!t) return;
    setToken(t);
    load(t, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const decide = async (decision: string) => {
    if (!token || !selected) return;
    const res = await fetch(`${api}/contributors/applications/${selected.id}/review`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ decision, reviewNotes: notes || undefined }),
    });
    if (res.ok) {
      setMessage(`تم تحديث الطلب إلى: ${STATUS_LABELS[decision] || decision}`);
      setSelected(null);
      setNotes('');
      await load(token, filter);
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.message || 'تعذّر تنفيذ القرار');
    }
  };

  if (!token) return <main className="admin-shell"><p>يجب تسجيل الدخول.</p></main>;

  return (
    <main className="admin-shell">
      <h1>طلبات العضوية المهنية</h1>
      <p>
        قبول الطلب يمنح صاحبه صلاحية <strong>الإضافة فقط</strong>. تبقى كل مادة يضيفها قيد مراجعتك
        قبل النشر، ولا يستطيع نشرها أو تعديل حقوقها أو تعديل مادة مساهم آخر.
      </p>

      {message && <p style={{ color: '#8d6e00' }}>{message}</p>}

      <section>
        <label>تصفية حسب الحالة: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">الكل</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </section>

      <section>
        <table>
          <thead>
            <tr>
              <th>الاسم العام</th>
              <th>النوع</th>
              <th>الحالة</th>
              <th>تاريخ التقديم</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td>{a.publicDisplayName}</td>
                <td>{a.type === 'NARRATOR' ? 'راوٍ' : 'مؤرخ/باحث'}</td>
                <td>{STATUS_LABELS[a.status] || a.status}</td>
                <td>{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('ar') : '—'}</td>
                <td><button onClick={() => { setSelected(a); setNotes(''); }}>عرض</button></td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr><td colSpan={5}>لا توجد طلبات بهذه الحالة</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {selected && (
        <section style={{ border: '1px solid #ccc', padding: 16, marginTop: 16 }}>
          <h2>مراجعة الطلب</h2>

          <h3 style={{ color: '#1b5e20' }}>البيانات العامة (ستظهر للعامة بعد القبول)</h3>
          <ul>
            <li>الاسم العام: {selected.publicDisplayName}</li>
            <li>النبذة: {selected.publicBio}</li>
            <li>التخصصات: {selected.publicSpecialties}</li>
            {selected.publicCountry && <li>الدولة: {selected.publicCountry}</li>}
            {selected.publicRegion && <li>المنطقة: {selected.publicRegion}</li>}
          </ul>

          <h3 style={{ color: '#8d6e00' }}>بيانات التحقق (خاصة — لا تُنشر إطلاقًا)</h3>
          <ul>
            <li>الاسم الكامل: {selected.privateFullName}</li>
            <li>البريد: {selected.privateEmail}</li>
            {selected.privatePhoneNumber && <li>الهاتف: {selected.privatePhoneNumber}</li>}
            <li>الخبرة: {selected.privateExperience}</li>
            {selected.privateKnowledgeSources && <li>مصادر المعرفة: {selected.privateKnowledgeSources}</li>}
            {selected.privateCredentials && <li>المؤهلات: {selected.privateCredentials}</li>}
            {selected.privatePublications && <li>المؤلفات: {selected.privatePublications}</li>}
            <li>يعتمد على رواية شفهية: {selected.privateReliesOnOralTradition ? 'نعم' : 'لا'}</li>
            <li>لديه تسجيلات: {selected.privateHasRecordings ? 'نعم' : 'لا'}</li>
            <li>لديه وثائق: {selected.privateHasDocuments ? 'نعم' : 'لا'}</li>
          </ul>

          <textarea
            placeholder="ملاحظات المراجعة (تصل لصاحب الطلب)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ width: '100%' }}
          />

          <div style={{ marginTop: 12 }}>
            <button onClick={() => decide('APPROVED')}>اعتماد</button>
            <button onClick={() => decide('NEEDS_INFORMATION')}>طلب معلومات</button>
            <button onClick={() => decide('REJECTED')}>رفض</button>
            <button onClick={() => decide('SUSPENDED')}>تعليق</button>
            <button onClick={() => decide('REVOKED')}>سحب العضوية</button>
            <button onClick={() => setSelected(null)}>إغلاق</button>
          </div>
        </section>
      )}
    </main>
  );
}
