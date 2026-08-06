import { useEffect, useState } from 'react';

type Overview = {
  totalUsers: number;
  content: { totalPoems: number; publishedPoems: number; pendingReview: number; totalStories: number; publishedStories: number };
  ingestionJobs: number;
  search: { totalSearches: number; zeroResultSearches: number; zeroResultRate: number };
};

type TopQuery = { query: string; count: number };
type ViewedPoem = { id: string; title: string; viewCount: number };
type GrowthPoint = { date: string; count: number };

export default function AnalyticsAdmin() {
  const [token, setToken] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topQueries, setTopQueries] = useState<TopQuery[]>([]);
  const [mostViewed, setMostViewed] = useState<ViewedPoem[]>([]);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const authHeaders = (t: string) => ({ Authorization: `Bearer ${t}` });

  const load = async (t: string) => {
    const [oRes, qRes, vRes, gRes] = await Promise.all([
      fetch(`${api}/analytics/overview`, { headers: authHeaders(t) }),
      fetch(`${api}/analytics/search/top-queries`, { headers: authHeaders(t) }),
      fetch(`${api}/analytics/content/most-viewed-poems`, { headers: authHeaders(t) }),
      fetch(`${api}/analytics/users/growth`, { headers: authHeaders(t) }),
    ]);
    if (oRes.ok) setOverview(await oRes.json());
    if (qRes.ok) setTopQueries(await qRes.json());
    if (vRes.ok) setMostViewed(await vRes.json());
    if (gRes.ok) setGrowth(await gRes.json());
  };

  useEffect(() => {
    const t = localStorage.getItem('admin_access_token');
    if (!t) return;
    setToken(t);
    load(t);
  }, []);

  return (
    <main className="admin-shell">
      <h1>التحليلات الأساسية</h1>
      <p>أرقام حقيقية من قاعدة البيانات فقط — لا مؤشرات وهمية.</p>

      {overview && (
        <section>
          <h2>نظرة عامة</h2>
          <ul>
            <li>المستخدمون النشطون: {overview.totalUsers}</li>
            <li>القصائد: {overview.content.publishedPoems} منشورة / {overview.content.totalPoems} إجمالاً</li>
            <li>القصص: {overview.content.publishedStories} منشورة / {overview.content.totalStories} إجمالاً</li>
            <li>محتوى قيد المراجعة: {overview.content.pendingReview}</li>
            <li>مهام الاستيراد: {overview.ingestionJobs}</li>
            <li>
              عمليات البحث: {overview.search.totalSearches} — بلا نتائج: {overview.search.zeroResultSearches} (
              {(overview.search.zeroResultRate * 100).toFixed(1)}%)
            </li>
          </ul>
        </section>
      )}

      <section>
        <h2>أكثر عبارات البحث تكرارًا</h2>
        <ol>
          {topQueries.map((q) => (
            <li key={q.query}>{q.query} — {q.count} مرة</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>الأكثر مشاهدة (قصائد)</h2>
        <ol>
          {mostViewed.map((p) => (
            <li key={p.id}>{p.title} — {p.viewCount} مشاهدة</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>نمو المستخدمين (آخر 14 يومًا)</h2>
        <ul>
          {growth.map((g) => (
            <li key={g.date}>{g.date}: {g.count} مستخدم جديد</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
