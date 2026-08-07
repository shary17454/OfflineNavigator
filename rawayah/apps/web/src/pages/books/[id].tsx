import type { GetServerSideProps } from 'next';
import { ContentDetailPage, Meta } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';
import { verificationLabel } from '../../lib/verification';

type Book = {
  id: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  author?: string | null;
  editor?: string | null;
  publisher?: string | null;
  publishedYear?: number | null;
  edition?: string | null;
  pages?: number | null;
  isbn?: string | null;
  rights?: string | null;
  verificationLevel?: string | null;
};

export default function BookDetail({ item, failed }: { item: Book | null; failed: boolean }) {
  return (
    <ContentDetailPage
      title={item?.title ?? 'كتاب'}
      description={item?.summary?.slice(0, 160) || `${item?.title ?? 'كتاب'} — من كتب التراث في موروث`}
      path={`/books/${item?.id ?? ''}`}
      backHref="/books"
      backLabel="الكتب"
      found={Boolean(item)}
      failed={failed}
    >
      <Meta label="المؤلف" value={item?.author} />
      <Meta label="المحقق" value={item?.editor} />
      <Meta label="الناشر" value={item?.publisher} />
      <Meta label="سنة النشر" value={item?.publishedYear} />
      <Meta label="الطبعة" value={item?.edition} />
      <Meta label="عدد الصفحات" value={item?.pages} />
      <Meta label="ردمك" value={item?.isbn} />
      <Meta label="الحقوق" value={item?.rights} />
      <Meta label="مستوى التوثيق" value={verificationLabel(item?.verificationLevel)} />

      {item?.summary ? <p>{item.summary}</p> : null}
      {item?.body ? <p style={{ lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{item.body}</p> : null}
    </ContentDetailPage>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { data, failed } = await ssrGet<Book>(`/books/${String(ctx.params?.id ?? '')}`);
  return { props: { item: data ?? null, failed } };
};
