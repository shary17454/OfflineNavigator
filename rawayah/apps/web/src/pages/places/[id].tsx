import type { GetServerSideProps } from 'next';
import { ContentDetailPage, Meta } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';
import { verificationLabel } from '../../lib/verification';

type Place = {
  id: string;
  name: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  verificationLevel?: string | null;
};

export default function PlaceDetail({ item, failed }: { item: Place | null; failed: boolean }) {
  // الإحداثيات تُعرض فقط عند اكتمال الزوج: خط عرض بلا خط طول لا يحدد موضعًا.
  const hasCoords =
    typeof item?.latitude === 'number' && typeof item?.longitude === 'number';

  return (
    <ContentDetailPage
      title={item?.name ?? 'مكان'}
      description={item?.description?.slice(0, 160) || `${item?.name ?? 'مكان'} — مكان تراثي في موروث`}
      path={`/places/${item?.id ?? ''}`}
      backHref="/places"
      backLabel="الأماكن"
      found={Boolean(item)}
      failed={failed}
    >
      <Meta label="مستوى التوثيق" value={verificationLabel(item?.verificationLevel)} />
      {item?.description ? <p style={{ lineHeight: 1.9 }}>{item.description}</p> : null}
      {hasCoords ? (
        <Meta label="الإحداثيات" value={`${item!.latitude}، ${item!.longitude}`} />
      ) : null}
    </ContentDetailPage>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { data, failed } = await ssrGet<Place>(`/places/${String(ctx.params?.id ?? '')}`);
  return { props: { item: data ?? null, failed } };
};
