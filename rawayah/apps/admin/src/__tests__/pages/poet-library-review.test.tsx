import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PoetLibraryReview from '../../pages/poet-library-review';

const baseItem = (overrides: Record<string, unknown> = {}) => ({
  id: 'item-1',
  kind: 'AUDIO',
  title: 'تسجيل إلقاء',
  reviewState: 'APPROVED',
  rightsStatus: 'UNKNOWN',
  allowDisplay: false,
  allowDownload: false,
  allowCommercial: false,
  ...overrides,
});

// يثبت أن زر "نشر" في الواجهة معطَّل فعليًا ما لم تكن الحقوق مضبوطة —
// هذا انعكاس لبوابة الحقوق المفروضة على الخادم، وأي تعارض بينهما يعني
// أن مراجعًا قد يظن أن بإمكانه النشر بينما الخادم سيرفضه (أو العكس: يخفي
// الزر رغم أن النشر مسموح فعلًا).
describe('لوحة مراجعة مواد مكتبات الشعراء — بوابة الحقوق في الواجهة', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    localStorage.clear();
  });

  it('يطلب تسجيل الدخول عند عدم وجود جلسة مالك', () => {
    render(<PoetLibraryReview />);
    expect(screen.getByText('يجب تسجيل الدخول.')).toBeInTheDocument();
  });

  it('زر النشر معطَّل لمادة صوتية معتمدة لكن حقوقها UNKNOWN', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [baseItem({ rightsStatus: 'UNKNOWN', allowDisplay: false })],
    });

    render(<PoetLibraryReview />);
    await waitFor(() => screen.getByText('تسجيل إلقاء'));

    expect(screen.getByText('نشر')).toBeDisabled();
    expect(screen.getByText(/النشر محجوب: يجب ضبط حالة حقوق تسمح بالنشر/)).toBeInTheDocument();
  });

  it('زر النشر يبقى معطَّلًا حتى مع حقوق مسموحة إن كان العرض ممنوعًا', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [baseItem({ rightsStatus: 'PUBLIC_DOMAIN', allowDisplay: false })],
    });

    render(<PoetLibraryReview />);
    await waitFor(() => screen.getByText('تسجيل إلقاء'));

    expect(screen.getByText('نشر')).toBeDisabled();
  });

  it('زر النشر يُفعَّل فقط عند اعتماد المراجعة مع حقوق تسمح بالنشر وعرض مسموح', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [baseItem({ rightsStatus: 'PUBLIC_DOMAIN', allowDisplay: true })],
    });

    render(<PoetLibraryReview />);
    await waitFor(() => screen.getByText('تسجيل إلقاء'));

    expect(screen.getByText('نشر')).not.toBeDisabled();
    expect(screen.queryByText(/النشر محجوب/)).not.toBeInTheDocument();
  });

  it('المادة النصية لا تخضع لبوابة الحقوق — تُنشر بمجرد اعتمادها', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [baseItem({ kind: 'TEXT', rightsStatus: 'UNKNOWN', allowDisplay: false })],
    });

    render(<PoetLibraryReview />);
    await waitFor(() => screen.getByText('تسجيل إلقاء'));

    expect(screen.getByText('نشر')).not.toBeDisabled();
    // ولا تظهر أزرار ضبط الحقوق أصلًا لمادة ليست وسائط.
    expect(screen.queryByText(/ملك عام \+ عرض/)).not.toBeInTheDocument();
  });

  it('مادة لم تُعتمد بعد في المراجعة: زر النشر معطَّل حتى لو حقوقها سليمة', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [baseItem({ reviewState: 'SUBMITTED', rightsStatus: 'PUBLIC_DOMAIN', allowDisplay: true })],
    });

    render(<PoetLibraryReview />);
    await waitFor(() => screen.getByText('تسجيل إلقاء'));

    expect(screen.getByText('نشر')).toBeDisabled();
  });

  it('ضبط الحقوق يرسل الحالة الصحيحة للخادم', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [baseItem()] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => [baseItem({ rightsStatus: 'PUBLIC_DOMAIN', allowDisplay: true })] });

    render(<PoetLibraryReview />);
    await waitFor(() => screen.getByText('تسجيل إلقاء'));
    fireEvent.click(screen.getByText('ملك عام + عرض'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
    const [url, options] = (global.fetch as jest.Mock).mock.calls[1];
    expect(url).toContain('/poetry/items/item-1/rights');
    expect(JSON.parse(options.body)).toEqual({ rightsStatus: 'PUBLIC_DOMAIN', allowDisplay: true });
  });

  it('التنبيهات الآلية تُعرض كمساعدة موسومة صراحة — لا كقرار نهائي', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        baseItem({
          checks: [{ type: 'MISSING_SOURCE', severity: 'warning', message: 'لا يوجد مصدر لهذه المادة' }],
        }),
      ],
    });

    render(<PoetLibraryReview />);
    await waitFor(() => screen.getByText(/تنبيهات آلية \(للمساعدة فقط/));
    expect(screen.getByText('لا يوجد مصدر لهذه المادة')).toBeInTheDocument();
  });
});
