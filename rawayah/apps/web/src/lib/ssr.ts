/**
 * جلب البيانات على الخادم (SSR).
 *
 * لماذا هذا الملف منفصل عن `http.ts`: ذاك يقرأ الرمز من `localStorage`
 * ويستخدم `NEXT_PUBLIC_API_URL` وهو عنوان يراه المتصفح. أما عند التصيير
 * على الخادم فلا متصفح ولا `localStorage`، وقد يكون عنوان الـAPI الداخلي
 * مختلفًا تمامًا عن العنوان العام (شبكة Docker داخلية مثلًا). خلط الاثنين
 * كان سيجعل التصيير يعمل محليًا ويفشل في الإنتاج.
 *
 * الصفحات العامة فقط تُصيَّر على الخادم — الصفحات التي تتطلب حساب
 * المستخدم تبقى على المتصفح لأن محرك البحث لا يجب أن يرى محتوى حسابات.
 */

// عنوان يستخدمه خادم Next للوصول إلى الـAPI. يقع الاختيار على المتغير
// الداخلي أولًا، ثم العام، ثم التطوير المحلي.
const SERVER_API_URL =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export type SsrResult<T> = { data: T | null; failed: boolean };

/**
 * يجلب من الـAPI أثناء التصيير. لا يرمي استثناءً أبدًا: تعطُّل الـAPI يجب
 * أن يُنتج صفحة تشرح العطل للزائر، لا خطأ 500 يراه محرك البحث فيسقط
 * الصفحة من فهرسه.
 */
export async function ssrGet<T>(path: string, timeoutMs = 8000): Promise<SsrResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${SERVER_API_URL}${path.startsWith('/') ? '' : '/'}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    // 4xx تعني "المادة غير موجودة أو غير منشورة" — حالة طبيعية تُعرض
    // برسالتها، لا عطل خادم. حصر `failed` في 5xx وأخطاء الشبكة هو ما
    // يجعل رسالة "تعذّر الاتصال" صادقة عند ظهورها.
    if (!res.ok) return { data: null, failed: res.status >= 500 };
    return { data: (await res.json()) as T, failed: false };
  } catch {
    return { data: null, failed: true };
  } finally {
    clearTimeout(timer);
  }
}

/** اسم المنصة — مصدر واحد بدل تكراره في كل عنوان صفحة. */
export const SITE_NAME = 'موروث';

/** يبني عنوان الصفحة بصيغة موحّدة تظهر في نتائج البحث وتبويب المتصفح. */
export function pageTitle(...parts: string[]) {
  return [...parts.filter(Boolean), SITE_NAME].join(' — ');
}
