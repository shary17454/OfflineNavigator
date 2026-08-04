import { useEffect, useState } from 'react';

type UserItem = {
  id: string;
  email: string;
  status: string;
  profile?: { displayName?: string; fullName?: string };
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);

  const load = async () => {
    const token = localStorage.getItem('admin_access_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/users`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="admin-shell">
      <h1>إدارة المستخدمين</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.email} - {u.status} - {u.profile?.displayName || u.profile?.fullName || 'بدون اسم'}
          </li>
        ))}
      </ul>
      {users.length === 0 ? <p>لا يوجد بيانات أو لا توجد صلاحيات كافية.</p> : null}
    </main>
  );
}
