import { useEffect, useState } from 'react';
import { get } from '../../lib/http';

export default function PoemsPage() {
  const [poems, setPoems] = useState<any[]>([]);

  useEffect(() => {
    get<any[]>('/poems').then(setPoems).catch(() => setPoems([]));
  }, []);

  return (
    <main className="home">
      <h1>قصائد منصة رواية</h1>
      <ul>
        {poems.map((p) => (
          <li key={p.id}>
            <a href={`/poems/${p.id}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
