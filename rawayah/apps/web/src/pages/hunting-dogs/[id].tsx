import type { GetServerSideProps } from 'next';
import { ContentDetailPage, Meta } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';

type HuntingDogBreed = {
  id: string;
  name: string;
  origin?: string | null;
  traits?: string | null;
  usage?: string | null;
};

export default function HuntingDogDetail({
  item,
  failed,
}: {
  item: HuntingDogBreed | null;
  failed: boolean;
}) {
  return (
    <ContentDetailPage
      title={item?.name ?? 'سلالة'}
      description={item?.traits?.slice(0, 160) || `${item?.name ?? 'سلالة'} — من كلاب الصيد في موروث`}
      path={`/hunting-dogs/${item?.id ?? ''}`}
      backHref="/hunting-dogs"
      backLabel="كلاب الصيد"
      found={Boolean(item)}
      failed={failed}
    >
      <Meta label="الأصل" value={item?.origin} />
      <Meta label="الصفات" value={item?.traits} />
      <Meta label="الاستعمال" value={item?.usage} />
    </ContentDetailPage>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { data, failed } = await ssrGet<HuntingDogBreed>(`/hunting-dogs/${String(ctx.params?.id ?? '')}`);
  return { props: { item: data ?? null, failed } };
};
