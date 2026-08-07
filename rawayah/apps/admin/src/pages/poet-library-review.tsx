import { useEffect, useState } from 'react';

type Item = {
  id: string;
  kind: string;
  title: string;
  description?: string | null;
  bodyText?: string | null;
  mediaUrl?: string | null;
  externalUrl?: string | null;
  reciterName?: string | null;
  occasion?: string | null;
  sourceNotes?: string | null;
  rightsStatus: string;
  rightsHolder?: string | null;
  licenseName?: string | null;
  allowDisplay: boolean;
  allowDownload: boolean;
  allowCommercial: boolean;
  reviewState: string;
  poetFile?: { poet?: { id: string; fullName: string } };
  contributedBy?: { id: string; email: string; profile?: { displayName?: string } };
  checks?: Array<{ type: string; severity: 'info' | 'warning'; message: string }>;
};

const MEDIA_KINDS = ['AUDIO', 'VIDEO', 'IMAGE', 'DOCUMENT'];
const PUBLISHABLE_RIGHTS = ['PUBLIC_DOMAIN', 'LICENSED', 'PERMISSION_GRANTED'];

const RIGHTS_LABELS: Record<string, string> = {
  UNKNOWN: 'غير معروفة',
  UNDER_REVIEW: 'قيد المراجعة',
  PUBLIC_DOMAIN: 'ملك عام',
  LICENSED: 'مرخّصة',
  PERMISSION_GRANTED: 'إذن ممنوح',
  RESTRICTED: 'مقيّدة',
  EXPIRED: 'منتهية',
  TAKEDOWN_REQUESTED: 'مطلوب إزالتها',
};

const KIND_LABELS: Record<string, string> = {
  TEXT: 'نص',
  AUDIO: 'صوت',
  VIDEO: 'فيديو',
  IMAGE: 'صورة',
  DOCUMENT: 'وثيقة',
  EXTERNAL_LINK: 'رابط خارجي',
};

export default function PoetLibraryReview() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const authHeaders = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

  const load = async (t: string) => {
    const res = await fetch(`${api}/poetry/pending-review`, { headers: authHeaders(t) });
    if (res.ok) setItems(await res.json());
    else setMessage('تعذّر تحميل المواد');
  };

  useEffect(() => {
    const t = localStorage.getItem('admin_access_token');
    if (!t) return;
    setToken(t);
    load(t);
  }, []);

  const setRights = async (item: Item, rightsStatus: string, allowDisplay: boolean) => {
    if (!token) return;
    await fetch(`${api}/poetry/items/${item.id}/rights`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ rightsStatus, allowDisplay }),
    });
    setMessage('تم تحديث سجل الحقوق');
    await load(token);
  };

  const review = async (item: Item, decision: string) => {
    if (!token) return;
    await fetch(`${api}/poetry/items/${item.id}/review`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ decision }),
    });
    await load(token);
  };

  const publish = async (item: Item) => {
    if (!token) return;
    const res = await fetch(`${api}/poetry/items/${item.id}/publish`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    if (res.ok) {
      setMessage('تم نشر المادة');
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.message || 'تعذّر النشر');
    }
    await load(token);
  };

  if (!token) return <main className="admin-shell"><p>يجب تسجيل الدخول.</p></main>;

  return (
    <main className="admin-shell">
      <h1>مراجعة مواد مكتبات الشعراء</h1>
      <p>
        لا يمكن نشر مادة صوتية أو مرئية أو صورة أو وثيقة ما لم تكن حالة حقوقها من الحالات المسموح بها
        <strong> وكان العرض مسموحًا</strong>. هذا مفروض على مستوى الخادم لا الواجهة.
      </p>

      {message && <p style={{ color: '#8d6e00' }}>{message}</p>}

      {items.length === 0 && <p>لا توجد مواد بانتظار المراجعة.</p>}

      {items.map((item) => {
        const isMedia = MEDIA_KINDS.includes(item.kind);
        const rightsOk = !isMedia || (PUBLISHABLE_RIGHTS.includes(item.rightsStatus) && item.allowDisplay);
        const canPublish = item.reviewState === 'APPROVED' && rightsOk;

        return (
          <section key={item.id} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 16 }}>
            <h2>{item.title}</h2>
            <p>
              النوع: {KIND_LABELS[item.kind] || item.kind} — الشاعر: {item.poetFile?.poet?.fullName ?? '—'}
            </p>
            <p>
              أضافها: {item.contributedBy?.profile?.displayName || item.contributedBy?.email || '—'}
            </p>
            {item.description && <p>{item.description}</p>}
            {item.bodyText && <blockquote>{item.bodyText}</blockquote>}
            {item.reciterName && <p>الراوي/الملقي: {item.reciterName}</p>}
            {item.occasion && <p>المناسبة: {item.occasion}</p>}
            {item.sourceNotes && <p>ملاحظات المصدر: {item.sourceNotes}</p>}

            {item.checks && item.checks.length > 0 && (
              <div style={{ background: '#f5f5f5', padding: 12, margin: '12px 0', borderRight: '4px solid #999' }}>
                <strong>تنبيهات آلية (للمساعدة فقط — القرار لك):</strong>
                <ul style={{ margin: '8px 0 0' }}>
                  {item.checks.map((check, i) => (
                    <li key={i} style={{ color: check.severity === 'warning' ? '#b71c1c' : '#555' }}>
                      {check.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ background: '#fff8e6', padding: 12, margin: '12px 0' }}>
              <strong>الحقوق:</strong> {RIGHTS_LABELS[item.rightsStatus] || item.rightsStatus}
              {' — '}العرض: {item.allowDisplay ? 'مسموح' : 'ممنوع'}
              {item.rightsHolder && <> — المالك: {item.rightsHolder}</>}
              {isMedia && !rightsOk && (
                <p style={{ color: '#b71c1c' }}>
                  النشر محجوب: يجب ضبط حالة حقوق تسمح بالنشر مع السماح بالعرض.
                </p>
              )}
              {isMedia && (
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => setRights(item, 'PUBLIC_DOMAIN', true)}>ملك عام + عرض</button>
                  <button onClick={() => setRights(item, 'PERMISSION_GRANTED', true)}>إذن ممنوح + عرض</button>
                  <button onClick={() => setRights(item, 'LICENSED', true)}>مرخّصة + عرض</button>
                  <button onClick={() => setRights(item, 'RESTRICTED', false)}>مقيّدة (منع)</button>
                </div>
              )}
            </div>

            <p>حالة المراجعة: {item.reviewState}</p>
            <div>
              <button onClick={() => review(item, 'APPROVED')}>اعتماد</button>
              <button onClick={() => review(item, 'CHANGES_REQUESTED')}>طلب تعديل</button>
              <button onClick={() => review(item, 'REJECTED')}>رفض</button>
              <button onClick={() => publish(item)} disabled={!canPublish}>
                نشر
              </button>
            </div>
          </section>
        );
      })}
    </main>
  );
}
