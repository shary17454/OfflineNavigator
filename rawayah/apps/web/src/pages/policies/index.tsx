import { useEffect, useState } from 'react';
import Link from 'next/link';

type PolicyDoc = { id: string; code: string; version: string; titleAr: string; effectiveFrom: string };

/// فهرس وثائق الشروط والسياسات — يُقرأ من الخادم.
export default function PoliciesIndex() {
  const [docs, setDocs] = useState<PolicyDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    fetch(`${api}/policies`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDocs(data))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [api]);

  return (
    <main className="home">
      <h1>الشروط والسياسات</h1>
      <p>كل وثيقة محفوظة بإصدارها وتاريخ سريانها. التعديلات تُنشر كإصدار جديد ولا تُكتب فوق النص السابق.</p>
      {loading ? (
        <p>جارٍ التحميل…</p>
      ) : docs.length === 0 ? (
        <p>تعذّر تحميل الوثائق.</p>
      ) : (
        <ul>
          {docs.map((d) => (
            <li key={d.id} style={{ margin: '12px 0' }}>
              <Link href={`/policies/${d.code}`}>{d.titleAr}</Link>
              <span style={{ color: '#666', fontSize: 13 }}> — الإصدار {d.version}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
