import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ContentListPage } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';
import { verificationLabel } from '../../lib/verification';

export type Term = {
  id: string;
  term: string;
  meaning?: string | null;
  dialect?: string | null;
  pronunciation?: string | null;
  verificationLevel?: string | null;
};

export default function VocabularyPage({ items, failed }: { items: Term[]; failed: boolean }) {
  return (
    <ContentListPage
      title="المفردات"
      description="معجم المفردات التراثية: معناها ونطقها ولهجتها ومواضع استعمالها، بمستوى توثيق معلن لكل مفردة."
      path="/vocabulary"
      intro="مفردات تراثية قد تندثر بذهاب أهلها. لكل مفردة معناها ولهجتها ومثال على استعمالها متى ما توفّر."
      items={items}
      failed={failed}
      emptyText="لا توجد مفردات منشورة بعد."
      renderItem={(item) => (
        <>
          <h3>
            <Link href={`/vocabulary/${item.id}`}>{item.term}</Link>
            {item.pronunciation ? <span> ({item.pronunciation})</span> : null}
          </h3>
          {item.meaning ? <p>{item.meaning}</p> : null}
          <small>
            {item.dialect ? `اللهجة: ${item.dialect} • ` : ''}
            مستوى التوثيق: {verificationLabel(item.verificationLevel)}
          </small>
        </>
      )}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, failed } = await ssrGet<Term[]>('/vocabulary');
  return { props: { items: data ?? [], failed } };
};
