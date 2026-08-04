import { useState } from 'react';
import { get } from '../lib/http';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<any[]>([]);

  const run = async () => {
    const data = await get<any>(`/search?query=${encodeURIComponent(q)}`);
    setHits([...(data?.poems || []), ...(data?.stories || []), ...(data?.books || [])]);
  };

  return (
    <main className="search-page">
      <h1>البحث في رواية</h1>
      <div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن شاعر أو قصيدة..." />
        <button onClick={run}>بحث</button>
      </div>
      <ul>
        {hits.map((item) => <li key={item.id}>{item.title || item.name}</li>)}
      </ul>
    </main>
  );
}
