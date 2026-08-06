export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const TOKEN_KEY = 'rawaya_token';

export const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const headers = (token?: string | null) => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

function url(path: string) {
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function get<T>(path: string, withAuth = false) {
  const res = await fetch(url(path), { headers: headers(withAuth ? getToken() : undefined) });
  if (!res.ok) throw new Error('فشل الاتصال بالخادم');
  return (await res.json()) as T;
}

export async function post<T>(path: string, body?: unknown, withAuth = true) {
  const res = await fetch(url(path), {
    method: 'POST',
    headers: headers(withAuth ? getToken() : undefined),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && (data as { message?: string }).message) || 'فشل تنفيذ الطلب';
    throw new Error(message);
  }
  return data as T;
}
