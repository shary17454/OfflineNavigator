import type { GetServerSideProps } from 'next';
import { ContentDetailPage, Meta } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';
import { verificationLabel } from '../../lib/verification';

type Proverb = {
  id: string;
  phrase: string;
  explanation?: string | null;
  story?: string | null;
  region?: string | null;
  usage?: string | null;
  verificationLevel?: string | null;
};

export default function ProverbDetail({ item, failed }: { item: Proverb | null; failed: boolean }) {
  return (
    <ContentDetailPage
      title={item?.phrase ?? 'مثل'}
      description={item?.explanation?.slice(0, 160) || `${item?.phrase ?? 'مثل'} — شرحه وقصته في موروث`}
      path={`/proverbs/${item?.id ?? ''}`}
      backHref="/proverbs"
      backLabel="الأمثال"
      found={Boolean(item)}
      failed={failed}
    >
      <Meta label="المنطقة" value={item?.region} />
      <Meta label="مورد الاستعمال" value={item?.usage} />
      <Meta label="مستوى التوثيق" value={verificationLabel(item?.verificationLevel)} />

      {item?.explanation ? (
        <section>
          <h2>الشرح</h2>
          <p style={{ lineHeight: 1.9 }}>{item.explanation}</p>
        </section>
      ) : null}

      {item?.story ? (
        <section>
          <h2>قصة المثل</h2>
          <p style={{ lineHeight: 1.9 }}>{item.story}</p>
        </section>
      ) : null}
    </ContentDetailPage>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { data, failed } = await ssrGet<Proverb>(`/proverbs/${String(ctx.params?.id ?? '')}`);
  return { props: { item: data ?? null, failed } };
};
