import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ContentListPage } from '../components/ContentPage';
import { ssrGet } from '../lib/ssr';

type Poet = { id: string; fullName: string; knownAs?: string; region?: string; era?: string };

export default function PoetsPage({ items, failed }: { items: Poet[]; failed: boolean }) {
  return (
    <ContentListPage
      title="الشعراء"
      description="شعراء العربية قديمًا وحديثًا: أسماؤهم وعصورهم ومناطقهم، ولكل شاعر مكتبة تجمع قصائده وتسجيلاته ووثائقه."
      path="/poets"
      items={items}
      failed={failed}
      emptyText="لا يوجد شعراء منشورون بعد."
      renderItem={(item) => (
        <>
          <h3>
            <Link href={`/poets/${item.id}`}>{item.fullName}</Link>
          </h3>
          {item.knownAs ? <p>{item.knownAs}</p> : null}
          <small>{[item.era, item.region].filter(Boolean).join(' • ')}</small>
        </>
      )}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, failed } = await ssrGet<Poet[]>('/poets');
  return { props: { items: data ?? [], failed } };
};
