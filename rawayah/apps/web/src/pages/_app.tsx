import type { AppProps } from 'next/app';
import Head from 'next/head';
import Link from 'next/link';
import '../styles/globals.css';
import { SITE_NAME } from '../lib/ssr';

// أقسام المحتوى العامة. القائمة هنا ليست تزيينًا: بلا روابط داخلية لا
// يصل زاحف محرك البحث إلى الصفحات إطلاقًا مهما كانت مُصيَّرة على الخادم.
const SECTIONS: Array<{ href: string; label: string }> = [
  { href: '/poetry', label: 'الشعر' },
  { href: '/poets', label: 'الشعراء' },
  { href: '/poems', label: 'القصائد' },
  { href: '/stories', label: 'القصص' },
  { href: '/books', label: 'الكتب' },
  { href: '/proverbs', label: 'الأمثال' },
  { href: '/vocabulary', label: 'المفردات' },
  { href: '/places', label: 'الأماكن' },
  { href: '/horses', label: 'الخيل' },
  { href: '/camels', label: 'الإبل' },
  { href: '/hunting', label: 'الصقارة والقنص' },
  { href: '/hunting-dogs', label: 'كلاب الصيد' },
  { href: '/topics', label: 'الموضوعات' },
];

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* عنوان ووصف احتياطيان للصفحات التي لا تحدد وسومها بنفسها.
            صفحات المحتوى تتجاوزهما عبر مكوّن Seo. */}
        <title>{`${SITE_NAME} — ذاكرة التراث العربي`}</title>
        <meta name="description" content="موروث: منصة لحفظ التراث العربي وتوثيقه — الشعر والقصص والأمثال والمفردات والخيل والإبل والصقارة، بمصادرها ومستوى توثيقها." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <html dir="rtl" lang="ar" />
      </Head>

      <div className="app-shell">
        <header className="site-header">
          <Link href="/">{SITE_NAME}</Link>
          <nav aria-label="أقسام الموقع">
            <ul className="site-nav">
              {SECTIONS.map((s) => (
                <li key={s.href}>
                  <Link href={s.href}>{s.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main>
          <Component {...pageProps} />
        </main>

        <footer className="site-footer">
          <Link href="/about">عن المنصة</Link>
          <Link href="/policies">السياسات</Link>
          <Link href="/terms">الشروط</Link>
          <Link href="/privacy">الخصوصية</Link>
          <Link href="/contact">تواصل</Link>
        </footer>
      </div>
    </>
  );
}
