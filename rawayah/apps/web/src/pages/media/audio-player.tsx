import { useRouter } from 'next/router';

export default function AudioPlayerPage() {
  const router = useRouter();
  const url = String(router.query.url || '');
  const title = String(router.query.title || 'مقطع صوتي');

  return (
    <main className="home">
      <h1>{title}</h1>
      {url ? <audio controls src={url} style={{ width: '100%' }} /> : <p>لا يوجد مصدر صوتي.</p>}
    </main>
  );
}
