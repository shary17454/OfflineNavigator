import { useEffect, useState } from 'react';
import { get } from '../lib/http';

type Story = { id: string; title: string; summary?: string; location?: string };

export default function StoriesPage() {
  const [items, setItems] = useState<Story[]>([]);

  useEffect(() => {
    get<Story[]>('/stories').then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <main className="home">
      <h1>القصص</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <h3>{item.title}</h3>
            {item.summary ? <p>{item.summary}</p> : null}
            {item.location ? <small>{item.location}</small> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
