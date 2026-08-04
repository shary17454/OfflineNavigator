import { useEffect, useState } from 'react';

type Log = { id: string; action: string; entityType: string; notes?: string; createdAt: string; actorId?: string };

export default function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([]);

  const load = async () => {
    const token = localStorage.getItem('admin_access_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/admin/moderation-logs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.ok) setLogs(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="admin-shell">
      <h1>سجل المراجعات</h1>
      <ul>
        {logs.map((item) => (
          <li key={item.id}>
            {item.action} - {item.entityType} - {new Date(item.createdAt).toLocaleString('ar-SA')} - {item.actorId || 'نظام'}
            {item.notes ? <p>{item.notes}</p> : null}
          </li>
        ))}
      </ul>
      {logs.length === 0 ? <p>لا توجد سجلات بعد.</p> : null}
    </main>
  );
}
