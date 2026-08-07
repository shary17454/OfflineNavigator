import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ssrGet } from '../lib/ssr';
import { verificationLabel } from '../lib/verification';
import { ContentDetailPage, ContentListPage, Meta } from './ContentPage';

/**
 * الخيل والإبل والصقارة والقنص تشترك في نفس شكل البيانات على الخادم
 * (`name`/`summary`/`description`/`verificationLevel`). بناء ثلاث نسخ
 * متطابقة من الصفحة كان سيضاعف مواضع التعديل بلا فائدة، فبُنيت مرة
 * واحدة وتُستدعى بعنوانها ومسارها.
 */

export type HeritageItem = {
  id: string;
  slug?: string | null;
  name: string;
  summary?: string | null;
  description?: string | null;
  verificationLevel?: string | null;
};

type SectionConfig = {
  /** مسار الـAPI ومسار الصفحة معًا — متطابقان في كل الأقسام الثلاثة. */
  route: string;
  title: string;
  description: string;
  intro: string;
  emptyText: string;
};

export function heritageListPage(config: SectionConfig) {
  return function HeritageList({ items, failed }: { items: HeritageItem[]; failed: boolean }) {
    return (
      <ContentListPage
        title={config.title}
        description={config.description}
        path={`/${config.route}`}
        intro={config.intro}
        items={items}
        failed={failed}
        emptyText={config.emptyText}
        renderItem={(item) => (
          <>
            <h3>
              <Link href={`/${config.route}/${item.id}`}>{item.name}</Link>
            </h3>
            {item.summary ? <p>{item.summary}</p> : null}
            <small>مستوى التوثيق: {verificationLabel(item.verificationLevel)}</small>
          </>
        )}
      />
    );
  };
}

export function heritageDetailPage(config: SectionConfig) {
  return function HeritageDetail({ item, failed }: { item: HeritageItem | null; failed: boolean }) {
    // الوصف المختصر أنسب لنتائج البحث من النص الكامل؛ وعند غيابه يُبنى
    // وصف من اسم المادة وقسمها بدل ترك الوسم فارغًا.
    const description =
      item?.summary?.slice(0, 160) ||
      item?.description?.slice(0, 160) ||
      `${item?.name ?? config.title} — ${config.title} في موروث`;

    return (
      <ContentDetailPage
        title={item?.name ?? config.title}
        description={description}
        path={`/${config.route}/${item?.id ?? ''}`}
        backHref={`/${config.route}`}
        backLabel={config.title}
        found={Boolean(item)}
        failed={failed}
      >
        <Meta label="مستوى التوثيق" value={verificationLabel(item?.verificationLevel)} />
        {item?.summary ? <p>{item.summary}</p> : null}
        {item?.description ? <p style={{ lineHeight: 1.9 }}>{item.description}</p> : null}
        {!item?.summary && !item?.description ? (
          <p>لم تُضَف تفاصيل هذه المادة بعد.</p>
        ) : null}
      </ContentDetailPage>
    );
  };
}

export function heritageListServerSideProps(route: string): GetServerSideProps {
  return async () => {
    const { data, failed } = await ssrGet<HeritageItem[]>(`/${route}`);
    return { props: { items: data ?? [], failed } };
  };
}

export function heritageDetailServerSideProps(route: string): GetServerSideProps {
  return async (ctx) => {
    const id = String(ctx.params?.id ?? '');
    const { data, failed } = await ssrGet<HeritageItem>(`/${route}/${id}`);
    return { props: { item: data ?? null, failed } };
  };
}
