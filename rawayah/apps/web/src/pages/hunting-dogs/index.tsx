import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ContentListPage } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';

export type HuntingDogBreed = {
  id: string;
  name: string;
  origin?: string | null;
  traits?: string | null;
  usage?: string | null;
};

export default function HuntingDogsPage({
  items,
  failed,
}: {
  items: HuntingDogBreed[];
  failed: boolean;
}) {
  return (
    <ContentListPage
      title="كلاب الصيد"
      description="سلالات كلاب الصيد العربية كالسلوقي: أصولها وصفاتها ومواضع استعمالها في القنص."
      path="/hunting-dogs"
      intro="السلوقي وغيره من كلاب الصيد جزء من تراث القنص العربي، لكل سلالة أصلها وصفاتها التي عُرفت بها."
      items={items}
      failed={failed}
      emptyText="لا توجد سلالات منشورة بعد."
      renderItem={(item) => (
        <>
          <h3>
            <Link href={`/hunting-dogs/${item.id}`}>{item.name}</Link>
          </h3>
          {item.traits ? <p>{item.traits}</p> : null}
          {item.origin ? <small>الأصل: {item.origin}</small> : null}
        </>
      )}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, failed } = await ssrGet<HuntingDogBreed[]>('/hunting-dogs');
  return { props: { items: data ?? [], failed } };
};
