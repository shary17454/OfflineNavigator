import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>رواية</title>
        <meta name="description" content="منصة رواية… ذاكرة التراث العربي" />
        <html dir="rtl" lang="ar" />
      </Head>
      <div className="app-shell">
        <header className="site-header">رواية</header>
        <main><Component {...pageProps} /></main>
      </div>
    </>
  );
}
