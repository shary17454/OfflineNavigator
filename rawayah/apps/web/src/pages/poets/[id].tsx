import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { get } from '../../lib/http';

type Item = {
  id: string;
  kind: string;
  title: string;
  description?: string | null;
  bodyText?: string | null;
  occasion?: string | null;
  reciterName?: string | null;
  rightsHolder?: string | null;
  licenseName?: string | null;
  contributedBy?: { profile?: { displayName?: string } | null } | null;
};

type Narration = {
  id: string;
  label: string;
  body: string;
  differenceNote?: string | null;
  verificationLevel: string;
  source?: { title: string } | null;
};

type NarrationGroup = { subjectTitle: string; narrations: Narration[] };

type LibraryPayload = {
  poet: Record<string, any>;
  nameVariants: Array<{ name: string; variantType: string }>;
  overview?: string | null;
  tabs: Array<{ key: string; label: string; count: number }>;
  poems: Array<{ id: string; title: string; summary?: string | null }>;
  texts: Item[];
  audios: Item[];
  videos: Item[];
  images: Item[];
  documents: Item[];
  links: Item[];
  stories: Array<{ id: string; title: string }>;
  narrationGroups: NarrationGroup[];
  sources: Array<{ id: string; title: string; author?: string | null; tier?: number | null }>;
};

const VERIFICATION_LABELS: Record<string, string> = {
  VERIFIED: 'موثّقة',
  PARTIAL: 'موثّقة جزئيًا',
  ORAL: 'رواية شفهية',
  DISPUTED: 'محل خلاف',
  INCOMPLETE: 'ناقصة',
  UNDER_REVIEW: 'قيد المراجعة',
};

// عرض التاريخ مع دقته — لا يُعرض تاريخ ظني كأنه مؤكد.
function formatDate(date?: string | null, precision?: string | null) {
  if (!date) return null;
  switch (precision) {
    case 'APPROXIMATE': return `نحو ${date}`;
    case 'DECADE': return `في عقد ${date}`;
    case 'CENTURY': return `القرن ${date}`;
    case 'DISPUTED': return `${date} (مختلف فيه)`;
    case 'UNKNOWN': return `${date} (غير مؤكد)`;
    default: return date;
  }
}

/// مكتبة الشاعر في الموقع العام. التبويبات تأتي من الخادم، والفارغ منها
/// لا يُعاد أصلًا فلا يُعرض هنا.
export default function PoetLibraryPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<LibraryPayload | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<string>('overview');

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    get<LibraryPayload>(`/poets/${id}/library`)
      .then((payload) => {
        setData(payload);
        if (payload.tabs.length > 0) setTab(payload.tabs[0].key);
      })
      .catch(() => setError(true));
  }, [id]);

  if (error) return <main className="home"><p>الشاعر غير موجود أو غير منشور.</p></main>;
  if (!data) return <main className="home"><p>جارٍ التحميل…</p></main>;

  const poet = data.poet;
  const birth = formatDate(poet.birthDate, poet.birthDatePrecision);
  const death = formatDate(poet.deathDate, poet.deathDatePrecision);

  const renderItems = (items: Item[]) => (
    <ul>
      {items.map((item) => {
        const meta = [
          item.reciterName ? `الراوي: ${item.reciterName}` : null,
          item.occasion ? `المناسبة: ${item.occasion}` : null,
          item.contributedBy?.profile?.displayName ? `أضافها: ${item.contributedBy.profile.displayName}` : null,
          item.rightsHolder ? `الحقوق: ${item.rightsHolder}` : null,
          item.licenseName ? `الترخيص: ${item.licenseName}` : null,
        ].filter(Boolean);
        return (
          <li key={item.id} style={{ margin: '12px 0' }}>
            <strong>{item.title}</strong>
            {item.description && <p style={{ margin: '4px 0' }}>{item.description}</p>}
            {item.bodyText && <p style={{ margin: '4px 0', lineHeight: 1.9 }}>{item.bodyText}</p>}
            {meta.length > 0 && (
              <p style={{ color: '#666', fontSize: 13, margin: '4px 0' }}>{meta.join(' • ')}</p>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <main className="home">
      <p><Link href="/poets">← الشعراء</Link></p>
      <h1>{poet.fullName}</h1>

      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0' }}>
        {data.tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '6px 12px',
              border: '1px solid #e3d6be',
              borderRadius: 16,
              background: tab === t.key ? '#b68843' : 'transparent',
              color: tab === t.key ? '#fff' : 'inherit',
              cursor: 'pointer',
            }}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <section>
          {poet.knownAs && <p>الاسم المشهور: {poet.knownAs}</p>}
          {poet.kunya && <p>الكنية: {poet.kunya}</p>}
          {poet.laqab && <p>اللقب: {poet.laqab}</p>}
          {birth && <p>الميلاد: {birth}</p>}
          {death && <p>الوفاة: {death}</p>}
          {poet.era && <p>العصر: {poet.era}</p>}
          {poet.region && <p>المنطقة: {poet.region}</p>}
          {data.nameVariants.length > 0 && (
            <p>أسماء أخرى: {data.nameVariants.map((v) => v.name).join('، ')}</p>
          )}
          {poet.disputeNote && (
            <p style={{ background: '#fff6e0', border: '1px solid #b68843', padding: 12, borderRadius: 8 }}>
              اختلاف المصادر: {poet.disputeNote}
            </p>
          )}
          {poet.biography && <p style={{ lineHeight: 1.9 }}>{poet.biography}</p>}
          {data.overview && <p style={{ lineHeight: 1.9 }}>{data.overview}</p>}
        </section>
      )}

      {tab === 'poems' && (
        <section>
          <ul>
            {data.poems.map((poem) => (
              <li key={poem.id} style={{ margin: '10px 0' }}>
                <Link href={`/poems/${poem.id}`}>{poem.title}</Link>
              </li>
            ))}
          </ul>
          {data.texts.length > 0 && renderItems(data.texts)}
        </section>
      )}

      {tab === 'audio' && <section>{renderItems(data.audios)}</section>}
      {tab === 'video' && <section>{renderItems(data.videos)}</section>}
      {tab === 'images' && <section>{renderItems(data.images)}</section>}
      {tab === 'documents' && <section>{renderItems(data.documents)}</section>}
      {tab === 'links' && <section>{renderItems(data.links)}</section>}

      {tab === 'stories' && (
        <section>
          <ul>
            {data.stories.map((s) => (
              <li key={s.id}><Link href={`/stories/${s.id}`}>{s.title}</Link></li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'narrations' && (
        <section>
          <p style={{ background: '#fff6e0', padding: 12, borderRadius: 8 }}>
            تُعرض الروايات كما وردت دون ترجيح إحداها على الأخرى، فالمسألة محل اختلاف بين المصادر.
          </p>
          {data.narrationGroups.map((group, gi) => (
            <article key={gi} style={{ border: '1px solid #e3d6be', padding: 16, margin: '16px 0', borderRadius: 8 }}>
              <h3>{group.subjectTitle}</h3>
              <p style={{ color: '#666', fontSize: 13 }}>وردت {group.narrations.length} روايات مختلفة</p>
              {group.narrations.map((n) => (
                <div key={n.id} style={{ borderTop: '1px solid #eee', paddingTop: 10, marginTop: 10 }}>
                  <strong style={{ color: '#b68843' }}>{n.label}</strong>
                  <p style={{ lineHeight: 1.9 }}>{n.body}</p>
                  {n.differenceNote && (
                    <p style={{ color: '#8d6e00', fontSize: 13 }}>موضع الاختلاف: {n.differenceNote}</p>
                  )}
                  <p style={{ color: '#666', fontSize: 13 }}>
                    {[
                      n.source ? `المصدر: ${n.source.title}` : null,
                      `مستوى التوثيق: ${VERIFICATION_LABELS[n.verificationLevel] || n.verificationLevel}`,
                    ].filter(Boolean).join(' • ')}
                  </p>
                </div>
              ))}
            </article>
          ))}
        </section>
      )}

      {tab === 'sources' && (
        <section>
          <ul>
            {data.sources.map((s) => (
              <li key={s.id}>
                {s.title}
                {s.author && ` — ${s.author}`}
                {s.tier && ` (مستوى المصدر: ${s.tier})`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
