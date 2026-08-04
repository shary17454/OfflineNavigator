import { useEffect, useState } from 'react';
import { get } from '../lib/http';

type Book = { id: string; title: string; summary?: string; author?: string; publisher?: string };

export default function BooksPage() {
  const [items, setItems] = useState<Book[]>([]);

  useEffect(() => {
    get<Book[]>('/books').then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <main className="home">
      <h1>الكتب</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <h3>{item.title}</h3>
            {item.author ? <p>{item.author}</p> : null}
            {item.publisher ? <small>دار النشر: {item.publisher}</small> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
