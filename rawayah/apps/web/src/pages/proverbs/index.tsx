import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ContentListPage } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';
import { verificationLabel } from '../../lib/verification';

export type Proverb = {
  id: string;
  phrase: string;
  explanation?: string | null;
  region?: string | null;
  verificationLevel?: string | null;
};

export default function ProverbsPage({ items, failed }: { items: Proverb[]; failed: boolean }) {
  return (
    <ContentListPage
      title="الأمثال"
      description="الأمثال العربية والشعبية بشرحها وقصتها ومنطقتها، مع ذكر مستوى توثيق كل مثل."
      path="/proverbs"
      intro="المثل يختصر تجربة، وقد يُروى بألفاظ مختلفة باختلاف المناطق. تُعرض هنا الرواية كما وردت مع منطقتها."
      items={items}
      failed={failed}
      emptyText="لا توجد أمثال منشورة بعد."
      renderItem={(item) => (
        <>
          <h3>
            <Link href={`/proverbs/${item.id}`}>{item.phrase}</Link>
          </h3>
          {item.explanation ? <p>{item.explanation}</p> : null}
          <small>
            {item.region ? `المنطقة: ${item.region} • ` : ''}
            مستوى التوثيق: {verificationLabel(item.verificationLevel)}
          </small>
        </>
      )}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, failed } = await ssrGet<Proverb[]>('/proverbs');
  return { props: { items: data ?? [], failed } };
};
