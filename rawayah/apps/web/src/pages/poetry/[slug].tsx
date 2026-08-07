import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Seo } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';

type Poem = { id: string; slug: string; title: string; summary?: string | null };
type TermPayload = {
  term: { id: string; slug: string; nameAr: string; dimension: string };
  mergedInto?: string | null;
  poems: Poem[];
};

/// قصائد قسم واحد. التصنيف المدموج يعرض محتوى التصنيف الهدف بدل قائمة فارغة.
export default function PoetryTermPage({
  data,
  failed,
}: {
  data: TermPayload | null;
  failed: boolean;
}) {
  return (
    <main className="home">
      <Seo
        title={data?.term.nameAr ?? 'قسم الشعر'}
        description={`قصائد ${data?.term.nameAr ?? 'القسم'} في موروث — بنصوصها ورواياتها ومستوى توثيقها.`}
        path={`/poetry/${data?.term.slug ?? ''}`}
      />
      <p>
        <Link href="/poetry">← كل أقسام الشعر</Link>
      </p>

      {failed ? (
        <p role="alert">تعذّر الاتصال بالخادم. أعد المحاولة بعد قليل.</p>
      ) : !data ? (
        <p>القسم غير موجود.</p>
      ) : (
        <>
          <h1>{data.term.nameAr}</h1>
          {data.poems.length === 0 ? (
            <p>لا توجد قصائد منشورة في هذا القسم بعد.</p>
          ) : (
            <ul>
              {data.poems.map((poem) => (
                <li key={poem.id} style={{ margin: '10px 0' }}>
                  <Link href={`/poems/${poem.id}`}>{poem.title}</Link>
                  {poem.summary && (
                    <p style={{ color: '#666', fontSize: 14, margin: '4px 0' }}>{poem.summary}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slug = String(ctx.params?.slug ?? '');
  const { data, failed } = await ssrGet<TermPayload>(`/poetry/taxonomy/${slug}/poems`);
  return { props: { data: data ?? null, failed } };
};
