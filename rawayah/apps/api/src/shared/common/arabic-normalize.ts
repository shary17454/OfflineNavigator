// تطبيع نصوص عربية موحّد: يُستخدم في البحث وكشف التكرار معًا.
export function normalizeArabic(input: string): string {
  return input
    .replace(/[ً-ْٰ]/g, '') // إزالة التشكيل (فتحة/ضمة/كسرة/سكون/تنوين...)
    .replace(/ـ/g, '') // إزالة التطويل (ـ)
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function trigrams(input: string): Set<string> {
  const s = `  ${input} `;
  const grams = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) grams.add(s.slice(i, i + 3));
  return grams;
}

// تشابه تقريبي (0 إلى 1) بلا اعتماد على امتداد قاعدة بيانات — يكفي لكشف التكرار الأساسي محليًا.
export function trigramSimilarity(a: string, b: string): number {
  const na = normalizeArabic(a);
  const nb = normalizeArabic(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const ta = trigrams(na);
  const tb = trigrams(nb);
  let intersection = 0;
  for (const g of ta) if (tb.has(g)) intersection++;
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
