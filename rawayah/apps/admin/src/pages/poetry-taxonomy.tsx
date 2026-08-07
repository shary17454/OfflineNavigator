import { useEffect, useState } from 'react';

type Term = {
  id: string;
  slug: string;
  nameAr: string;
  description?: string | null;
  dimension: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  mergedIntoId?: string | null;
  _count?: { poems: number; children: number };
};

const DIMENSION_LABELS: Record<string, string> = {
  TRADITION: 'نوع الشعر',
  ERA: 'العصر',
  THEME: 'الغرض والموضوع',
  REGION: 'المنطقة',
  PERFORMANCE: 'طريقة الأداء',
  COLLECTION: 'مجموعات',
};

export default function PoetryTaxonomyAdmin() {
  const [token, setToken] = useState<string | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const [slug, setSlug] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [dimension, setDimension] = useState('THEME');
  const [parentId, setParentId] = useState('');

  const [mergeFrom, setMergeFrom] = useState('');
  const [mergeTo, setMergeTo] = useState('');

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const authHeaders = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

  const load = async (t: string) => {
    const res = await fetch(`${api}/poetry/taxonomy/manage/all`, { headers: authHeaders(t) });
    if (res.ok) setTerms(await res.json());
    else setMessage('تعذّر تحميل التصنيفات — تأكد من صلاحية الحساب');
  };

  useEffect(() => {
    const t = localStorage.getItem('admin_access_token');
    if (!t) return;
    setToken(t);
    load(t);
  }, []);

  const createTerm = async () => {
    if (!token || !slug || !nameAr) return;
    const res = await fetch(`${api}/poetry/taxonomy`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ slug, nameAr, dimension, ...(parentId ? { parentId } : {}) }),
    });
    if (res.ok) {
      setSlug('');
      setNameAr('');
      setParentId('');
      setMessage('تمت إضافة التصنيف');
      await load(token);
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.message || 'تعذّرت الإضافة');
    }
  };

  const toggleActive = async (term: Term) => {
    if (!token) return;
    await fetch(`${api}/poetry/taxonomy/${term.id}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ isActive: !term.isActive }),
    });
    await load(token);
  };

  const move = async (term: Term, delta: number) => {
    if (!token) return;
    const siblings = terms
      .filter((t) => t.dimension === term.dimension && !t.mergedIntoId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = siblings.findIndex((t) => t.id === term.id);
    const target = index + delta;
    if (target < 0 || target >= siblings.length) return;
    const reordered = [...siblings];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    await fetch(`${api}/poetry/taxonomy/reorder`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ orderedIds: reordered.map((t) => t.id) }),
    });
    await load(token);
  };

  const doMerge = async () => {
    if (!token || !mergeFrom || !mergeTo) return;
    const res = await fetch(`${api}/poetry/taxonomy/${mergeFrom}/merge`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ targetTermId: mergeTo }),
    });
    if (res.ok) {
      setMessage('تم الدمج — التصنيف القديم بقي محفوظًا مع إشارة إلى الهدف');
      setMergeFrom('');
      setMergeTo('');
      await load(token);
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.message || 'تعذّر الدمج');
    }
  };

  if (!token) return <main className="admin-shell"><p>يجب تسجيل الدخول.</p></main>;

  const byDimension = terms.reduce<Record<string, Term[]>>((acc, t) => {
    (acc[t.dimension] ??= []).push(t);
    return acc;
  }, {});

  return (
    <main className="admin-shell">
      <h1>تصنيفات الشعر</h1>
      <p>
        التصنيفات موزعة على أبعاد مستقلة: القصيدة الواحدة قد تكون نبطية وفي الغزل ومن منطقة وعصر
        معيّن في آنٍ واحد. الدمج لا يحذف التصنيف القديم بل يبقيه مع إشارة إلى التصنيف الهدف حتى لا
        تنكسر الروابط.
      </p>

      {message && <p style={{ color: '#8d6e00' }}>{message}</p>}

      <section>
        <h2>إضافة تصنيف</h2>
        <input placeholder="المعرّف المختصر (إنجليزي)" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input placeholder="الاسم بالعربية" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        <select value={dimension} onChange={(e) => setDimension(e.target.value)}>
          {Object.entries(DIMENSION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">— بلا تصنيف أب —</option>
          {terms
            .filter((t) => t.dimension === dimension && !t.mergedIntoId)
            .map((t) => (
              <option key={t.id} value={t.id}>{t.nameAr}</option>
            ))}
        </select>
        <button onClick={createTerm}>إضافة</button>
      </section>

      <section>
        <h2>دمج تصنيفين</h2>
        <select value={mergeFrom} onChange={(e) => setMergeFrom(e.target.value)}>
          <option value="">التصنيف المصدر</option>
          {terms.filter((t) => !t.mergedIntoId).map((t) => (
            <option key={t.id} value={t.id}>{t.nameAr} ({DIMENSION_LABELS[t.dimension]})</option>
          ))}
        </select>
        <select value={mergeTo} onChange={(e) => setMergeTo(e.target.value)}>
          <option value="">التصنيف الهدف</option>
          {terms.filter((t) => !t.mergedIntoId).map((t) => (
            <option key={t.id} value={t.id}>{t.nameAr} ({DIMENSION_LABELS[t.dimension]})</option>
          ))}
        </select>
        <button onClick={doMerge}>دمج</button>
      </section>

      {Object.entries(byDimension).map(([dim, list]) => (
        <section key={dim}>
          <h2>{DIMENSION_LABELS[dim] || dim}</h2>
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>القصائد</th>
                <th>الحالة</th>
                <th>الترتيب</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((t) => (
                  <tr key={t.id} style={{ opacity: t.mergedIntoId ? 0.5 : 1 }}>
                    <td>
                      {t.parentId ? '↳ ' : ''}
                      {t.nameAr}
                      {t.mergedIntoId && <span> (مدموج)</span>}
                    </td>
                    <td>{t._count?.poems ?? 0}</td>
                    <td>{t.isActive ? 'ظاهر' : 'مخفي'}</td>
                    <td>{t.sortOrder}</td>
                    <td>
                      {!t.mergedIntoId && (
                        <>
                          <button onClick={() => toggleActive(t)}>{t.isActive ? 'إخفاء' : 'إظهار'}</button>
                          <button onClick={() => move(t, -1)}>▲</button>
                          <button onClick={() => move(t, 1)}>▼</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
