import type { GetServerSideProps } from 'next';
import { ContentDetailPage, Meta } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';
import { verificationLabel } from '../../lib/verification';

type Story = {
  id: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  narrator?: string | null;
  researcher?: string | null;
  characters?: string | null;
  location?: string | null;
  era?: string | null;
  verificationLevel?: string | null;
};

export default function StoryDetail({ item, failed }: { item: Story | null; failed: boolean }) {
  return (
    <ContentDetailPage
      title={item?.title ?? 'قصة'}
      description={item?.summary?.slice(0, 160) || `${item?.title ?? 'قصة'} — قصة تراثية موثّقة في موروث`}
      path={`/stories/${item?.id ?? ''}`}
      backHref="/stories"
      backLabel="القصص"
      found={Boolean(item)}
      failed={failed}
    >
      {/* الراوي والباحث يُذكران دائمًا عند توفرهما: الرواية الشفهية تُنسب
          إلى راويها، ونسبتها للمنصة وحدها تجعلها تبدو حقيقة مجردة. */}
      <Meta label="الراوي" value={item?.narrator} />
      <Meta label="الباحث" value={item?.researcher} />
      <Meta label="المكان" value={item?.location} />
      <Meta label="العصر" value={item?.era} />
      <Meta label="الشخصيات" value={item?.characters} />
      <Meta label="مستوى التوثيق" value={verificationLabel(item?.verificationLevel)} />

      {item?.summary ? <p>{item.summary}</p> : null}
      {item?.body ? <p style={{ lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{item.body}</p> : null}
      {!item?.summary && !item?.body ? <p>لم يُضَف نص هذه القصة بعد.</p> : null}
    </ContentDetailPage>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { data, failed } = await ssrGet<Story>(`/stories/${String(ctx.params?.id ?? '')}`);
  return { props: { item: data ?? null, failed } };
};
