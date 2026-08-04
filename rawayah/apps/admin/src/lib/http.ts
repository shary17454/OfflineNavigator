export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function getAdmin<T>(path: string, token: string) {
  const res = await fetch(`${API_URL}${path.startsWith('/') ? '' : '/'}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('فشل الاتصال الإدارية');
  return (await res.json()) as T;
}
