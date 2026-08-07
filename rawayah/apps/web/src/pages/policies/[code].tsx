import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type PolicyDoc = {
  code: string;
  version: string;
  titleAr: string;
  bodyAr: string;
  effectiveFrom: string;
};

/// عرض وثيقة سياسة واحدة بنصها النافذ المقروء من الخادم — لا نص ثابت
/// في الموقع، حتى يسري تعديل المالك فورًا.
export default function PolicyPage() {
  const router = useRouter();
  const { code } = router.query;
  const [doc, setDoc] = useState<PolicyDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    if (!code || typeof code !== 'string') return;
    setLoading(true);
    fetch(`${api}/policies/${code}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDoc(data))
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, [code, api]);

  return (
    <main className="home">
      <p><Link href="/policies">← كل الوثائق</Link></p>
      {loading ? (
        <p>جارٍ التحميل…</p>
      ) : !doc ? (
        <p>تعذّر تحميل الوثيقة.</p>
      ) : (
        <>
          <h1>{doc.titleAr}</h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            الإصدار {doc.version} — سارٍ منذ {new Date(doc.effectiveFrom).toLocaleDateString('ar')}
          </p>
          <article style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}>{doc.bodyAr}</article>
        </>
      )}
    </main>
  );
}
