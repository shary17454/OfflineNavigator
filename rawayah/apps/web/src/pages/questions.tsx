import { useEffect, useState } from 'react';
import { get } from '../lib/http';

type Question = { id: string; title: string; category: string; status?: string; createdAt: string };

export default function QuestionsPage() {
  const [items, setItems] = useState<Question[]>([]);

  useEffect(() => {
    get<Question[]>('/questions').then((res) => setItems(res || [])).catch(() => setItems([]));
  }, []);

  return (
    <main className="home">
      <h1>الأسئلة</h1>
      <ul>
        {items.map((q) => (
          <li key={q.id}>
            <strong>{q.title}</strong>
            <small> {q.category} - {q.status || 'جديد'} </small>
            <p>{new Date(q.createdAt).toLocaleString('ar-SA')}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
