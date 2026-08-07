import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ContentDetailPage, Meta } from '../../components/ContentPage';
import { ssrGet } from '../../lib/ssr';
import { verificationLabel } from '../../lib/verification';

type Verse = { id: string; orderIndex: number; text: string };

type Version = {
  id: string;
  label?: string | null;
  isPrimary?: boolean;
  sourceNotes?: string | null;
  verificationLevel?: string | null;
  verses?: Verse[];
};

type Attribution = {
  id: string;
  claimedName?: string | null;
  consensus?: string | null;
  notes?: string | null;
  poet?: { id: string; fullName: string } | null;
};

type Poem = {
  id: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  meter?: string | null;
  era?: string | null;
  region?: string | null;
  occasion?: string | null;
  poemStory?: string | null;
  explanation?: string | null;
  verificationLevel?: string | null;
  poet?: { id: string; fullName: string } | null;
  versions?: Version[];
  attributions?: Attribution[];
};

const CONSENSUS_LABELS: Record<string, string> = {
  AGREED: 'متفق عليها',
  DISPUTED: 'مختلف فيها',
};

export default function PoemDetail({ item, failed }: { item: Poem | null; failed: boolean }) {
  const versions = item?.versions ?? [];
  const attributions = item?.attributions ?? [];

  // النسبة المختلف فيها تُعلن قبل النص لا بعده: قارئ يقرأ القصيدة كاملة
  // على أنها لفلان ثم يكتشف الخلاف في آخر الصفحة قد لا يصل إليه أصلًا.
  const disputed = attributions.some((a) => a.consensus === 'DISPUTED');

  return (
    <ContentDetailPage
      title={item?.title ?? 'قصيدة'}
      description={
        item?.summary?.slice(0, 160) ||
        `${item?.title ?? 'قصيدة'}${item?.poet ? ` — ${item.poet.fullName}` : ''} — في موروث`
      }
      path={`/poems/${item?.id ?? ''}`}
      backHref="/poems"
      backLabel="القصائد"
      found={Boolean(item)}
      failed={failed}
    >
      {item?.poet ? (
        <p>
          الشاعر: <Link href={`/poets/${item.poet.id}`}>{item.poet.fullName}</Link>
        </p>
      ) : null}
      <Meta label="البحر" value={item?.meter} />
      <Meta label="العصر" value={item?.era} />
      <Meta label="المنطقة" value={item?.region} />
      <Meta label="المناسبة" value={item?.occasion} />
      <Meta label="مستوى التوثيق" value={verificationLabel(item?.verificationLevel)} />

      {disputed ? (
        <p role="note" className="dispute-note">
          نسبة هذه القصيدة مختلف فيها بين المصادر — تفصيل الخلاف في قسم «النسبة» أدناه.
        </p>
      ) : null}

      {item?.summary ? <p>{item.summary}</p> : null}

      {/* النص: الروايات البنيوية أولى بالعرض من النص الخام لأنها تحمل
          مصدر كل رواية ومستوى توثيقها. النص الخام يُعرض فقط عند غيابها. */}
      {versions.length > 0 ? (
        versions.map((v) => (
          <section key={v.id}>
            <h2>
              {v.label || 'الرواية'}
              {v.isPrimary ? ' (الرواية الأشهر)' : ''}
            </h2>
            <Meta label="المصدر" value={v.sourceNotes} />
            <Meta label="مستوى التوثيق" value={verificationLabel(v.verificationLevel)} />
            <div className="poem-verses">
              {(v.verses ?? [])
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((verse) => (
                  <p key={verse.id} className="poem-verse">
                    {verse.text}
                  </p>
                ))}
            </div>
          </section>
        ))
      ) : item?.body ? (
        <section>
          <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 2, fontFamily: 'inherit' }}>{item.body}</pre>
        </section>
      ) : (
        <p>لم يُضَف نص هذه القصيدة بعد.</p>
      )}

      {attributions.length > 0 ? (
        <section>
          <h2>النسبة</h2>
          <ul>
            {attributions.map((a) => (
              <li key={a.id}>
                {a.poet ? (
                  <Link href={`/poets/${a.poet.id}`}>{a.poet.fullName}</Link>
                ) : (
                  a.claimedName ?? 'غير محدد'
                )}
                {a.consensus ? ` — ${CONSENSUS_LABELS[a.consensus] ?? a.consensus}` : ''}
                {a.notes ? <small> ({a.notes})</small> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {item?.poemStory ? (
        <section>
          <h2>قصة القصيدة</h2>
          <p style={{ lineHeight: 1.9 }}>{item.poemStory}</p>
        </section>
      ) : null}

      {item?.explanation ? (
        <section>
          <h2>الشرح</h2>
          <p style={{ lineHeight: 1.9 }}>{item.explanation}</p>
        </section>
      ) : null}
    </ContentDetailPage>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { data, failed } = await ssrGet<Poem>(`/poems/${String(ctx.params?.id ?? '')}`);
  return { props: { item: data ?? null, failed } };
};
