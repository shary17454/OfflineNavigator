import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ContentListPage } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';

export type Topic = {
  id: string;
  slug?: string | null;
  title: string;
  summary?: string | null;
};

export default function TopicsPage({ items, failed }: { items: Topic[]; failed: boolean }) {
  return (
    <ContentListPage
      title="الموضوعات"
      description="موضوعات تراثية جامعة: العادات والحرف والألعاب الشعبية والرحلات وما لا ينتمي إلى قسم واحد بعينه."
      path="/topics"
      intro="بعض مواد التراث لا تنتمي إلى قسم واحد — كالعادات والحرف والرحلات. تُجمع هنا في موضوعات مستقلة."
      items={items}
      failed={failed}
      emptyText="لا توجد موضوعات منشورة بعد."
      renderItem={(item) => (
        <>
          <h3>
            <Link href={`/topics/${item.id}`}>{item.title}</Link>
          </h3>
          {item.summary ? <p>{item.summary}</p> : null}
        </>
      )}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, failed } = await ssrGet<Topic[]>('/topics');
  return { props: { items: data ?? [], failed } };
};
