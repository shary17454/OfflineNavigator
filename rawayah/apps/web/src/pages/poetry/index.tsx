import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Seo } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';

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
export default function PoetryIndex({
  data,
  failed,
}: {
  data: TaxonomyPayload | null;
  failed: boolean;
}) {
  const present = data ? ORDER.filter((d) => (data.dimensions[d] || []).length > 0) : [];

  return (
    <main className="home">
      <Seo
        title="الشعر"
        description="أقسام الشعر العربي: الفصيح والنبطي والمحاورة، وعصوره وأغراضه من الغزل إلى الفروسية، مصنّفة على أبعاد مستقلة."
        path="/poetry"
      />
      <h1>الشعر</h1>

      {failed || !data ? (
        <p role="alert">تعذّر تحميل أقسام الشعر. أعد المحاولة بعد قليل.</p>
      ) : (
        <>
          <p>
            القصيدة الواحدة قد تنتمي لأكثر من قسم في آنٍ واحد — قد تكون نبطية وفي الغزل ومن منطقة
            وعصر معيّن معًا. لذلك التصنيفات موزعة على أبعاد مستقلة لا قائمة واحدة.
          </p>

          {present.map((dim) => (
            <section key={dim}>
              <h2>{DIMENSION_LABELS[dim] || dim}</h2>
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 10, listStyle: 'none', padding: 0 }}>
                {data.dimensions[dim].map((term) => (
                  <li key={term.id}>
                    <Link
                      href={`/poetry/${term.slug}`}
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        border: '1px solid #e3d6be',
                        borderRadius: 16,
                      }}
                    >
                      {term.nameAr}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, failed } = await ssrGet<TaxonomyPayload>('/poetry/taxonomy');
  return { props: { data: data ?? null, failed } };
};
