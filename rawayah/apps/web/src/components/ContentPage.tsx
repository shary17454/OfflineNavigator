import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { pageTitle, SITE_NAME } from '../lib/ssr';

/**
 * الإطاران العامّان لصفحات المحتوى العامة على الموقع.
 *
 * وجودهما ليس اختصارًا في الكتابة فحسب: وسوم SEO تُنسى بسهولة عند إضافة
 * صفحة جديدة، وربطها بالإطار يجعل نسيانها مستحيلًا — كل صفحة محتوى تحصل
 * على عنوان ووصف ورابط قانوني تلقائيًا.
 */

// يُضبط في الإنتاج. عند غيابه يُحذف وسم `canonical` كليًا بدل إخراج رابط
// نسبي — الرابط القانوني النسبي أسوأ من غيابه لأنه يُفسَّر خطأً.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || '';

type SeoProps = {
  title: string;
  description: string;
  path: string;
};

export function Seo({ title, description, path }: SeoProps) {
  const fullTitle = pageTitle(title);
  const canonical = SITE_URL ? `${SITE_URL}${path}` : undefined;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical ? <link rel="canonical" href={canonical} /> : null}

      {/* المشاركة على المنصات الاجتماعية تعرض هذه الوسوم لا وسوم الصفحة العادية. */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:locale" content="ar_SA" />
      <meta name="twitter:card" content="summary" />
    </Head>
  );
}

type ListPageProps<T> = {
  title: string;
  description: string;
  path: string;
  intro?: ReactNode;
  items: T[];
  failed: boolean;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
};

/**
 * صفحة قائمة عامة. تفصل صراحةً بين "تعذّر الاتصال بالخادم" و"لا يوجد
 * محتوى بعد" — الحالتان تنتجان قائمة فارغة، وعرضهما بنفس الرسالة يخفي
 * عطلًا حقيقيًا خلف رسالة تبدو طبيعية.
 */
export function ContentListPage<T extends { id: string }>({
  title,
  description,
  path,
  intro,
  items,
  failed,
  emptyText,
  renderItem,
}: ListPageProps<T>) {
  return (
    <main className="home">
      <Seo title={title} description={description} path={path} />
      <h1>{title}</h1>
      {intro ? <p>{intro}</p> : null}

      {failed ? (
        <p role="alert">تعذّر الاتصال بالخادم. أعد المحاولة بعد قليل.</p>
      ) : items.length === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <ul className="content-list">
          {items.map((item) => (
            <li key={item.id}>{renderItem(item)}</li>
          ))}
        </ul>
      )}
    </main>
  );
}

type DetailPageProps = {
  title: string;
  description: string;
  path: string;
  backHref: string;
  backLabel: string;
  found: boolean;
  failed: boolean;
  children: ReactNode;
};

export function ContentDetailPage({
  title,
  description,
  path,
  backHref,
  backLabel,
  found,
  failed,
  children,
}: DetailPageProps) {
  return (
    <main className="home">
      <Seo title={title} description={description} path={path} />
      <p>
        <Link href={backHref}>← {backLabel}</Link>
      </p>

      {failed ? (
        <p role="alert">تعذّر الاتصال بالخادم. أعد المحاولة بعد قليل.</p>
      ) : !found ? (
        <p>المادة غير موجودة أو لم تُنشر بعد.</p>
      ) : (
        <>
          <h1>{title}</h1>
          {children}
        </>
      )}
    </main>
  );
}

/** سطر بيانات وصفية: يُخفى تلقائيًا إن كانت القيمة فارغة. */
export function Meta({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <p className="meta-row">
      <span className="meta-label">{label}: </span>
      {value}
    </p>
  );
}
