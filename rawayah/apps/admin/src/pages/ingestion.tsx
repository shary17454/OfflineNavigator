import { useEffect, useState } from 'react';

type IngestionSource = {
  id: string;
  name: string;
  organization?: string | null;
  sourceType: string;
  tier: number;
  isApproved: boolean;
};

type IngestionJob = {
  id: string;
  method: string;
  status: string;
  recordCount: number;
  acceptedCount: number;
  rejectedCount: number;
  source?: IngestionSource | null;
  _count?: { records: number };
};

type ValidationResult = { id: string; checkType: string; passed: boolean; note?: string | null };
type DuplicateCandidate = { id: string; existingContentId?: string | null; similarityScore?: number | null; matchReason: string; status: string };
type IngestionRecord = {
  id: string;
  targetContentType: string;
  stage: string;
  rawData: Record<string, unknown>;
  rejectionReason?: string | null;
  validationResults: ValidationResult[];
  duplicateCandidates: DuplicateCandidate[];
};

export default function IngestionAdmin() {
  const [token, setToken] = useState<string | null>(null);
  const [sources, setSources] = useState<IngestionSource[]>([]);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [records, setRecords] = useState<IngestionRecord[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [stagePayload, setStagePayload] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState('مكتبة وطنية');
  const [message, setMessage] = useState('');

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const authHeaders = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

  const loadAll = async (t: string) => {
    const [sRes, jRes] = await Promise.all([
      fetch(`${api}/ingestion/sources`, { headers: authHeaders(t) }),
      fetch(`${api}/ingestion/jobs`, { headers: authHeaders(t) }),
    ]);
    if (sRes.ok) setSources(await sRes.json());
    if (jRes.ok) setJobs(await jRes.json());
  };

  const loadRecords = async (t: string, jobId: string) => {
    const res = await fetch(`${api}/ingestion/records?jobId=${jobId}`, { headers: authHeaders(t) });
    if (res.ok) setRecords(await res.json());
  };

  useEffect(() => {
    const t = localStorage.getItem('admin_access_token');
    if (!t) return;
    setToken(t);
    loadAll(t);
  }, []);

  useEffect(() => {
    if (token && selectedJobId) loadRecords(token, selectedJobId);
  }, [selectedJobId, token]);

  const createSource = async () => {
    if (!token || !newSourceName) return;
    await fetch(`${api}/ingestion/sources`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ name: newSourceName, sourceType: newSourceType }),
    });
    setNewSourceName('');
    await loadAll(token);
  };

  const approveSource = async (id: string) => {
    if (!token) return;
    await fetch(`${api}/ingestion/sources/${id}/approve`, { method: 'POST', headers: authHeaders(token) });
    await loadAll(token);
  };

  const createJob = async (method: 'MANUAL_JSON' | 'MANUAL_ENTRY', sourceId?: string) => {
    if (!token) return;
    const res = await fetch(`${api}/ingestion/jobs`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ method, sourceId }),
    });
    if (res.ok) {
      const job = await res.json();
      setSelectedJobId(job.id);
    }
    await loadAll(token);
  };

  const stage = async () => {
    if (!token || !selectedJobId) return;
    let records: unknown;
    try {
      records = JSON.parse(stagePayload);
    } catch {
      setMessage('صيغة JSON غير صالحة');
      return;
    }
    const res = await fetch(`${api}/ingestion/jobs/${selectedJobId}/stage`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ records }),
    });
    const data = await res.json();
    setMessage(res.ok ? `تمت المعاينة: ${data.acceptedCount} مقبول (قيد المراجعة البشرية) / ${data.rejectedCount} مرفوض تلقائيًا` : 'فشل الاستيراد — تحقق من الصيغة');
    await loadRecords(token, selectedJobId);
    await loadAll(token);
  };

  const approveRecord = async (id: string) => {
    if (!token) return;
    await fetch(`${api}/ingestion/records/${id}/approve`, { method: 'POST', headers: authHeaders(token) });
    await loadRecords(token, selectedJobId);
  };

  const rejectRecord = async (id: string) => {
    if (!token) return;
    const reason = window.prompt('سبب الرفض؟') || 'مرفوض من المراجع';
    await fetch(`${api}/ingestion/records/${id}/reject`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ reason }),
    });
    await loadRecords(token, selectedJobId);
  };

  const publishApproved = async () => {
    if (!token) return;
    const approvedIds = records.filter((r) => r.stage === 'APPROVED').map((r) => r.id);
    if (!approvedIds.length) {
      setMessage('لا توجد سجلات معتمدة للنشر كمسودات');
      return;
    }
    const label = window.prompt('عنوان الدفعة؟') || `دفعة ${new Date().toISOString()}`;
    const res = await fetch(`${api}/ingestion/batches/publish`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ label, recordIds: approvedIds }),
    });
    setMessage(res.ok ? 'تم نقل السجلات المعتمدة كمسودات — تحتاج الآن سير المراجعة العادي (إرسال/مراجعة/نشر)' : 'فشل النشر');
    await loadRecords(token, selectedJobId);
  };

  return (
    <main className="admin-shell">
      <h1>استيراد ومراجعة المحتوى</h1>

      <section>
        <h2>مصادر الاستيراد المعتمدة</h2>
        <ul>
          {sources.map((s) => (
            <li key={s.id}>
              {s.name} — المستوى {s.tier} — {s.isApproved ? 'معتمد ✅' : 'غير معتمد'}
              {!s.isApproved && <button onClick={() => approveSource(s.id)}>اعتماد المصدر</button>}
            </li>
          ))}
        </ul>
        <input placeholder="اسم المصدر" value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} />
        <input placeholder="نوع المصدر" value={newSourceType} onChange={(e) => setNewSourceType(e.target.value)} />
        <button onClick={createSource}>إضافة مصدر (يحتاج اعتماد قبل الاستيراد منه)</button>
      </section>

      <section>
        <h2>مهام الاستيراد</h2>
        <button onClick={() => createJob('MANUAL_JSON')}>مهمة استيراد جديدة (JSON يدوي)</button>
        <ul>
          {jobs.map((j) => (
            <li key={j.id}>
              <button onClick={() => setSelectedJobId(j.id)} style={{ fontWeight: selectedJobId === j.id ? 'bold' : 'normal' }}>
                {j.id.slice(0, 8)} — {j.status} — {j.acceptedCount}/{j.recordCount} مقبول
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selectedJobId && (
        <section>
          <h2>معاينة قبل الاستيراد</h2>
          <p>
            الصق مصفوفة JSON بالشكل: <code>{'[{"targetContentType":"POEM","rawData":{"title":"...","sourceTitle":"..."}}]'}</code>
          </p>
          <textarea rows={6} style={{ width: '100%' }} value={stagePayload} onChange={(e) => setStagePayload(e.target.value)} />
          <button onClick={stage}>معاينة (تطبيع + كشف تكرار + فحص مصدر)</button>
          {message && <p><strong>{message}</strong></p>}

          <h3>السجلات قيد المراجعة</h3>
          <ul>
            {records.map((r) => (
              <li key={r.id} style={{ marginBottom: 16, borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
                <div>
                  <strong>{r.targetContentType}</strong> — {r.stage}
                  {typeof r.rawData?.title === 'string' ? ` — ${r.rawData.title}` : ''}
                </div>
                {r.rejectionReason && <div>سبب الرفض: {r.rejectionReason}</div>}
                <div>
                  فحوصات: {r.validationResults.map((v) => `${v.checkType}:${v.passed ? '✅' : '❌'}`).join(' ، ')}
                </div>
                {r.duplicateCandidates.length > 0 && (
                  <div>
                    تكرار محتمل: {r.duplicateCandidates.map((d) => `${d.matchReason} (${d.status})`).join(' ، ')}
                  </div>
                )}
                {r.stage === 'HUMAN_REVIEW' && (
                  <>
                    <button onClick={() => approveRecord(r.id)}>اعتماد</button>
                    <button onClick={() => rejectRecord(r.id)}>رفض</button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <button onClick={publishApproved}>نقل كل السجلات المعتمدة كمسودات محتوى حقيقية</button>
        </section>
      )}
    </main>
  );
}
