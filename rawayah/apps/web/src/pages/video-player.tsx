import { useRouter } from 'next/router';

export default function VideoPlayerPage() {
  const router = useRouter();
  const url = String(router.query.url || '');
  const title = String(router.query.title || 'فيديو');

  return (
    <main className="home">
      <h1>{title}</h1>
      {url ? <video controls src={url} style={{ width: '100%' }} /> : <p>لا يوجد فيديو.</p>}
    </main>
  );
}
