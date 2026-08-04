import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { get } from '../../lib/http';

type Poem = {
  id: string;
  title: string;
  summary?: string | null;
  body: string;
  verificationLevel?: string;
  poet?: { fullName: string };
};

export default function PoemDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [poem, setPoem] = useState<Poem | null>(null);

  useEffect(() => {
    if (!id) return;
    get<Poem>(`/poems/${id}`).then(setPoem).catch(() => setPoem(null));
  }, [id]);

  if (!poem) {
    return (
      <main className="home">
        <p>جاري تحميل القصيدة...</p>
      </main>
    );
  }

  return (
    <main className="home">
      <h1>{poem.title}</h1>
      <p>الدرجة: {poem.verificationLevel || 'غير محدد'}</p>
      {poem.summary ? <p>{poem.summary}</p> : null}
      {poem.poet ? <p>الشاعر: {poem.poet.fullName}</p> : null}
      <section>
        <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 2 }}>{poem.body}</pre>
      </section>
    </main>
  );
}
