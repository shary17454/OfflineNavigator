import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ContentListPage } from '../components/ContentPage';
import { ssrGet } from '../lib/ssr';
import { verificationLabel } from '../lib/verification';

type Story = {
  id: string;
  title: string;
  summary?: string;
  location?: string;
  verificationLevel?: string | null;
};

export default function StoriesPage({ items, failed }: { items: Story[]; failed: boolean }) {
  return (
    <ContentListPage
      title="القصص"
      description="قصص التراث وأخباره ورواياته الشفهية، بمصادرها ومستوى توثيق كل رواية."
      path="/stories"
      intro="القصة التراثية قد تُروى بأكثر من وجه. تُعرض الرواية كما وردت، ومستوى توثيقها معلن لا مخفي."
      items={items}
      failed={failed}
      emptyText="لا توجد قصص منشورة بعد."
      renderItem={(item) => (
        <>
          <h3>
            <Link href={`/stories/${item.id}`}>{item.title}</Link>
          </h3>
          {item.summary ? <p>{item.summary}</p> : null}
          <small>
            {item.location ? `${item.location} • ` : ''}
            مستوى التوثيق: {verificationLabel(item.verificationLevel)}
          </small>
        </>
      )}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, failed } = await ssrGet<Story[]>('/stories');
  return { props: { items: data ?? [], failed } };
};
