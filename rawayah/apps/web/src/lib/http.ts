export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const headers = (token?: string) => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

export async function get<T>(path: string) {
  const res = await fetch(`${API_URL}${path.startsWith('/') ? '' : '/'}${path}`, { headers: headers() });
  if (!res.ok) throw new Error('فشل الاتصال بالخادم');
  return (await res.json()) as T;
}
