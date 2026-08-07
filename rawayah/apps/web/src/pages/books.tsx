import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ContentListPage } from '../components/ContentPage';
import { ssrGet } from '../lib/ssr';

type Book = { id: string; title: string; summary?: string; author?: string; publisher?: string };

export default function BooksPage({ items, failed }: { items: Book[]; failed: boolean }) {
  return (
    <ContentListPage
      title="الكتب"
      description="كتب التراث ودواوينه المحققة: مؤلفوها وناشروها وما تحويه من مادة موثّقة."
      path="/books"
      items={items}
      failed={failed}
      emptyText="لا توجد كتب منشورة بعد."
      renderItem={(item) => (
        <>
          <h3>
            <Link href={`/books/${item.id}`}>{item.title}</Link>
          </h3>
          {item.summary ? <p>{item.summary}</p> : null}
          <small>
            {[item.author, item.publisher ? `دار النشر: ${item.publisher}` : null]
              .filter(Boolean)
              .join(' • ')}
          </small>
        </>
      )}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, failed } = await ssrGet<Book[]>('/books');
  return { props: { items: data ?? [], failed } };
};
