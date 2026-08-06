import { useEffect, useState } from 'react';
import Link from 'next/link';
import { get } from '../lib/http';

type HomePayload = {
  hero: string;
  featuredSections: string[];
};

export default function Home() {
  const [data, setData] = useState<HomePayload | null>(null);

  useEffect(() => {
    get<HomePayload>('/home').then(setData).catch(() => setData({ hero: 'رواية… ذاكرة التراث العربي', featuredSections: [] }));
  }, []);

  return (
    <main className="home">
      <h1>{data?.hero}</h1>
      <section>
        <h2>الأقسام المختارة</h2>
        <ul>
          {(data?.featuredSections || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <Link href="/search">ابدأ البحث</Link>
        <Link href="/reading-lists">قوائم القراءة</Link>
        <Link href="/payments">الاشتراكات</Link>
        <Link href="/poems">قصائد</Link>
        <Link href="/poets">شعراء</Link>
        <Link href="/stories">قصص</Link>
        <Link href="/books">كتب</Link>
        <Link href="/media/audio-player">مشغل الصوت</Link>
        <Link href="/video-player">مشغل الفيديو</Link>
        <Link href="/questions">الأسئلة</Link>
        <Link href="/account">حسابي</Link>
        <Link href="/login">تسجيل الدخول</Link>
      </section>
      <footer>
        <Link href="/about">من نحن</Link>
        <Link href="/contact">تواصل معنا</Link>
        <Link href="/privacy">سياسة الخصوصية</Link>
        <Link href="/terms">شروط الاستخدام</Link>
      </footer>
    </main>
  );
}
