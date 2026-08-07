import type { GetServerSideProps } from 'next';
import { ContentDetailPage } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';

type Topic = {
  id: string;
  title: string;
  summary?: string | null;
  body?: string | null;
};

export default function TopicDetail({ item, failed }: { item: Topic | null; failed: boolean }) {
  return (
    <ContentDetailPage
      title={item?.title ?? 'موضوع'}
      description={item?.summary?.slice(0, 160) || `${item?.title ?? 'موضوع'} — موضوع تراثي في موروث`}
      path={`/topics/${item?.id ?? ''}`}
      backHref="/topics"
      backLabel="الموضوعات"
      found={Boolean(item)}
      failed={failed}
    >
      {item?.summary ? <p>{item.summary}</p> : null}
      {item?.body ? <p style={{ lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{item.body}</p> : null}
      {!item?.summary && !item?.body ? <p>لم يُضَف نص هذا الموضوع بعد.</p> : null}
    </ContentDetailPage>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { data, failed } = await ssrGet<Topic>(`/topics/${String(ctx.params?.id ?? '')}`);
  return { props: { item: data ?? null, failed } };
};
