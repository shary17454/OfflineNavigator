import { useEffect, useState } from 'react';

type ReadingList = {
  id: string;
  title: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: string;
};

export default function ReadingListsPage() {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('rawaya_token') : null;
      try {
        const res = await fetch('http://localhost:4000/api/reading-lists', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = (await res.json()) as ReadingList[];
          setLists(data || []);
        } else {
          setLists([]);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) return <main className="home"><p>تحميل...</p></main>;

  return (
    <main className="home">
      <h1>قوائم القراءة</h1>
      {lists.length === 0 ? (
        <p>لا توجد قوائم قراءة مفعّلة أو لم يتم تسجيل الدخول.</p>
      ) : (
        <ul>
          {lists.map((list) => (
            <li key={list.id}>
              <h3>{list.title}</h3>
              <p>{list.description || 'بدون وصف'}</p>
              <small>{list.isPublic ? 'عامة' : 'خاصة'} • {new Date(list.createdAt).toLocaleString('ar-SA')}</small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
