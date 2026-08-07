import { useEffect, useState } from 'react';
import Link from 'next/link';
import { get } from '../../lib/http';

type Term = { id: string; slug: string; nameAr: string; description?: string | null };
type TaxonomyPayload = { dimensions: Record<string, Term[]>; total: number };

const DIMENSION_LABELS: Record<string, string> = {
  TRADITION: 'حسب نوع الشعر',
  ERA: 'حسب العصر',
  THEME: 'حسب الغرض والموضوع',
  PERFORMANCE: 'حسب طريقة الأداء',
  COLLECTION: 'مجموعات',
  REGION: 'حسب المنطقة',
};

const ORDER = ['TRADITION', 'ERA', 'THEME', 'PERFORMANCE', 'COLLECTION', 'REGION'];

/// أقسام الشعر — تُبنى بالكامل من تصنيفات الخادم، فلا نوع شعر مكتوب هنا.
export default function PoetryIndex() {
  const [data, setData] = useState<TaxonomyPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    get<TaxonomyPayload>('/poetry/taxonomy')
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <main className="home"><p>تعذّر تحميل أقسام الشعر.</p></main>;
  if (!data) return <main className="home"><p>جارٍ التحميل…</p></main>;

  const present = ORDER.filter((d) => (data.dimensions[d] || []).length > 0);

  return (
    <main className="home">
      <h1>الشعر</h1>
      <p>
        القصيدة الواحدة قد تنتمي لأكثر من قسم في آنٍ واحد — قد تكون نبطية وفي الغزل ومن منطقة وعصر
        معيّن معًا. لذلك التصنيفات موزعة على أبعاد مستقلة لا قائمة واحدة.
      </p>

      {present.map((dim) => (
        <section key={dim}>
          <h2>{DIMENSION_LABELS[dim] || dim}</h2>
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 10, listStyle: 'none', padding: 0 }}>
            {data.dimensions[dim].map((term) => (
              <li key={term.id}>
                <Link href={`/poetry/${term.slug}`} style={{ display: 'inline-block', padding: '6px 12px', border: '1px solid #e3d6be', borderRadius: 16 }}>
                  {term.nameAr}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
