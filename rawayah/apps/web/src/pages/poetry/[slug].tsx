import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { get } from '../../lib/http';

type Poem = { id: string; slug: string; title: string; summary?: string | null };
type TermPayload = {
  term: { id: string; slug: string; nameAr: string; dimension: string };
  mergedInto?: string | null;
  poems: Poem[];
};

/// قصائد قسم واحد. التصنيف المدموج يعرض محتوى التصنيف الهدف بدل قائمة فارغة.
export default function PoetryTermPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [data, setData] = useState<TermPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    get<TermPayload>(`/poetry/taxonomy/${slug}/poems`)
      .then(setData)
      .catch(() => setError(true));
  }, [slug]);

  if (error) return <main className="home"><p>القسم غير موجود.</p></main>;
  if (!data) return <main className="home"><p>جارٍ التحميل…</p></main>;

  return (
    <main className="home">
      <p><Link href="/poetry">← كل أقسام الشعر</Link></p>
      <h1>{data.term.nameAr}</h1>
      {data.poems.length === 0 ? (
        <p>لا توجد قصائد منشورة في هذا القسم بعد.</p>
      ) : (
        <ul>
          {data.poems.map((poem) => (
            <li key={poem.id} style={{ margin: '10px 0' }}>
              <Link href={`/poems/${poem.id}`}>{poem.title}</Link>
              {poem.summary && <p style={{ color: '#666', fontSize: 14, margin: '4px 0' }}>{poem.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
