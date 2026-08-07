import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ContentListPage } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';
import { verificationLabel } from '../../lib/verification';

type Poem = {
  id: string;
  title: string;
  summary?: string | null;
  meter?: string | null;
  era?: string | null;
  verificationLevel?: string | null;
  poet?: { fullName: string } | null;
};

export default function PoemsPage({ items, failed }: { items: Poem[]; failed: boolean }) {
  return (
    <ContentListPage
      title="القصائد"
      description="قصائد التراث العربي بنصوصها ورواياتها المختلفة ونسبتها إلى قائليها، مع مستوى توثيق كل قصيدة."
      path="/poems"
      intro="القصيدة قد تُروى بأكثر من رواية وتُنسب لأكثر من قائل. تُعرض الروايات كما وردت، والنسبة بمصدرها."
      items={items}
      failed={failed}
      emptyText="لا توجد قصائد منشورة بعد."
      renderItem={(item) => (
        <>
          <h3>
            <Link href={`/poems/${item.id}`}>{item.title}</Link>
          </h3>
          {item.summary ? <p>{item.summary}</p> : null}
          <small>
            {[
              item.poet?.fullName,
              item.meter ? `البحر: ${item.meter}` : null,
              item.era,
              `مستوى التوثيق: ${verificationLabel(item.verificationLevel)}`,
            ]
              .filter(Boolean)
              .join(' • ')}
          </small>
        </>
      )}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, failed } = await ssrGet<Poem[]>('/poems');
  return { props: { items: data ?? [], failed } };
};
