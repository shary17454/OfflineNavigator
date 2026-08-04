import { useEffect, useState } from 'react';
import { get } from '../lib/http';

type Poet = { id: string; fullName: string; knownAs?: string; region?: string };

export default function PoetsPage() {
  const [poets, setPoets] = useState<Poet[]>([]);

  useEffect(() => {
    get<Poet[]>('/poets').then(setPoets).catch(() => setPoets([]));
  }, []);

  return (
    <main className="home">
      <h1>الشعراء</h1>
      <ul>
        {poets.map((p) => (
          <li key={p.id}>
            <h3>{p.fullName}</h3>
            {p.knownAs ? <p>{p.knownAs}</p> : null}
            {p.region ? <small>{p.region}</small> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
