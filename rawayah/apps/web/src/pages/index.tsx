import { useEffect, useState } from 'react';
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
        <a href="/search">ابدأ البحث</a>
        <a href="/reading-lists">قوائم القراءة</a>
        <a href="/payments">الاشتراكات</a>
        <a href="/poems">قصائد</a>
        <a href="/poets">شعراء</a>
        <a href="/stories">قصص</a>
        <a href="/books">كتب</a>
        <a href="/media/audio-player">مشغل الصوت</a>
        <a href="/video-player">مشغل الفيديو</a>
        <a href="/questions">الأسئلة</a>
      </section>
    </main>
  );
}
