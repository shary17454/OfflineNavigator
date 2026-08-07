import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ContentListPage } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';
import { verificationLabel } from '../../lib/verification';

export type Place = {
  id: string;
  name: string;
  description?: string | null;
  verificationLevel?: string | null;
};

export default function PlacesPage({ items, failed }: { items: Place[]; failed: boolean }) {
  return (
    <ContentListPage
      title="الأماكن"
      description="الأماكن التراثية الواردة في الشعر والقصص والأخبار: مواقعها وأوصافها وما قيل فيها."
      path="/places"
      intro="أماكن ذُكرت في الشعر والرواية، بعضها معروف الموضع وبعضها مختلف في تحديده — ويُذكر الخلاف عند وجوده."
      items={items}
      failed={failed}
      emptyText="لا توجد أماكن منشورة بعد."
      renderItem={(item) => (
        <>
          <h3>
            <Link href={`/places/${item.id}`}>{item.name}</Link>
          </h3>
          {item.description ? <p>{item.description}</p> : null}
          <small>مستوى التوثيق: {verificationLabel(item.verificationLevel)}</small>
        </>
      )}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, failed } = await ssrGet<Place[]>('/places');
  return { props: { items: data ?? [], failed } };
};
