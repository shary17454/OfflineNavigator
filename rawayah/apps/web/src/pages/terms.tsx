import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

/// صفحة الشروط أصبحت تُقرأ من الخادم كوثيقة مُصدَّرة قابلة للتحرير من
/// لوحة المالك، فتُحوَّل إلى العارض الموحّد بدل نص ثابت في الموقع.
export default function TermsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/policies/TERMS_OF_SERVICE');
  }, [router]);

  return (
    <main className="home">
      <p>
        جارٍ التحويل إلى <Link href="/policies/TERMS_OF_SERVICE">الشروط والأحكام</Link>…
      </p>
    </main>
  );
}
