import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContributorsAdmin from '../../pages/contributors';

const APPLICATION = {
  id: 'app-1',
  type: 'NARRATOR',
  status: 'SUBMITTED',
  publicDisplayName: 'راوي القصيم',
  publicBio: 'راوٍ متخصص في الرواية الشفهية',
  publicSpecialties: 'الرواية الشفهية',
  privateFullName: 'عبدالله بن سعد',
  privateEmail: 'narrator@private.test',
  privatePhoneNumber: '0500000000',
  privateExperience: 'خمسة عشر عامًا',
  privateReliesOnOralTradition: true,
  privateHasRecordings: false,
  privateHasDocuments: false,
  submittedAt: '2026-01-01T00:00:00.000Z',
};

// يثبت أن المالك يرى القسمين معًا (العام والخاص) عند المراجعة — الفصل بين
// public/private مقصود للعرض العام لاحقًا فقط، لا لإخفاء شيء عن المراجع.
describe('لوحة إدارة طلبات العضوية المهنية', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    localStorage.clear();
  });

  it('يطلب تسجيل الدخول عند عدم وجود جلسة مالك', () => {
    render(<ContributorsAdmin />);
    expect(screen.getByText('يجب تسجيل الدخول.')).toBeInTheDocument();
  });

  it('عرض تفاصيل الطلب يظهر بيانات التحقق الخاصة إلى جانب العامة', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [APPLICATION] });

    render(<ContributorsAdmin />);
    await waitFor(() => screen.getByText('راوي القصيم'));
    fireEvent.click(screen.getByText('عرض'));

    expect(screen.getByText(/عبدالله بن سعد/)).toBeInTheDocument();
    expect(screen.getByText(/narrator@private.test/)).toBeInTheDocument();
    expect(screen.getByText(/0500000000/)).toBeInTheDocument();
  });

  it('اعتماد الطلب يرسل القرار الصحيح ويحدّث القائمة', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [APPLICATION] }) // التحميل الأول
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'APPROVED' }) }) // قرار الاعتماد
      .mockResolvedValueOnce({ ok: true, json: async () => [{ ...APPLICATION, status: 'APPROVED' }] }); // إعادة التحميل

    render(<ContributorsAdmin />);
    await waitFor(() => screen.getByText('راوي القصيم'));
    fireEvent.click(screen.getByText('عرض'));
    fireEvent.click(screen.getByText('اعتماد'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
    const [url, options] = (global.fetch as jest.Mock).mock.calls[1];
    expect(url).toContain('/contributors/applications/app-1/review');
    expect(JSON.parse(options.body)).toEqual({ decision: 'APPROVED', reviewNotes: undefined });
  });

  it('لا توجد طلبات بالحالة المختارة: يعرض رسالة واضحة لا جدولًا فارغًا صامتًا', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<ContributorsAdmin />);
    await waitFor(() => expect(screen.getByText('لا توجد طلبات بهذه الحالة')).toBeInTheDocument());
  });
});
