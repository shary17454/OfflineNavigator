/**
 * مستوى توثيق المادة — يُعرض دائمًا مع المحتوى التراثي.
 *
 * إخفاؤه يجعل الرواية الشفهية غير المؤكدة تبدو للقارئ كحقيقة مثبتة، وهو
 * ما تمنعه سياسة المصادر صراحةً. لذلك تُعرض حتى الحالة "قيد المراجعة".
 */
export const VERIFICATION_LABELS: Record<string, string> = {
  VERIFIED: 'موثّقة',
  PARTIAL: 'موثّقة جزئيًا',
  ORAL: 'رواية شفهية',
  DISPUTED: 'محل خلاف',
  INCOMPLETE: 'ناقصة التوثيق',
  UNDER_REVIEW: 'قيد المراجعة',
};

export function verificationLabel(level?: string | null) {
  if (!level) return VERIFICATION_LABELS.UNDER_REVIEW;
  return VERIFICATION_LABELS[level] ?? VERIFICATION_LABELS.UNDER_REVIEW;
}
