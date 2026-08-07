import type { GetServerSideProps } from 'next';
import { ContentDetailPage, Meta } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';
import { verificationLabel } from '../../lib/verification';

type Term = {
  id: string;
  term: string;
  pronunciation?: string | null;
  meaning?: string | null;
  usage?: string | null;
  example?: string | null;
  dialect?: string | null;
  audioUrl?: string | null;
  verificationLevel?: string | null;
};

export default function TermDetail({ item, failed }: { item: Term | null; failed: boolean }) {
  return (
    <ContentDetailPage
      title={item?.term ?? 'مفردة'}
      description={item?.meaning?.slice(0, 160) || `${item?.term ?? 'مفردة'} — معناها واستعمالها في موروث`}
      path={`/vocabulary/${item?.id ?? ''}`}
      backHref="/vocabulary"
      backLabel="المفردات"
      found={Boolean(item)}
      failed={failed}
    >
      <Meta label="النطق" value={item?.pronunciation} />
      <Meta label="اللهجة" value={item?.dialect} />
      <Meta label="المعنى" value={item?.meaning} />
      <Meta label="مورد الاستعمال" value={item?.usage} />
      <Meta label="مستوى التوثيق" value={verificationLabel(item?.verificationLevel)} />

      {item?.example ? (
        <section>
          <h2>مثال</h2>
          <p style={{ lineHeight: 1.9 }}>{item.example}</p>
        </section>
      ) : null}

      {/* النطق الصوتي جوهري في المفردات التراثية: كثير منها يُقرأ خطأً بلا سماع.
          يُستخدم مشغّل المتصفح الأصلي لأنه يكفي لمقطع قصير ولا يحتاج جافاسكربت. */}
      {item?.audioUrl ? (
        <section>
          <h2>النطق</h2>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls preload="none" src={item.audioUrl}>
            متصفحك لا يدعم تشغيل الصوت.
          </audio>
        </section>
      ) : null}
    </ContentDetailPage>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { data, failed } = await ssrGet<Term>(`/vocabulary/${String(ctx.params?.id ?? '')}`);
  return { props: { item: data ?? null, failed } };
};
