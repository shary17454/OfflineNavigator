import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../pages/login';

const pushMock = jest.fn();
const routerMock = { push: pushMock };
jest.mock('next/router', () => ({ useRouter: () => routerMock }));

// اختبار انحدار (Regression) لخطأ حقيقي وُجد وأُصلح في هذه الجلسة: صفحة
// تسجيل دخول لوحة الإدارة لم تكن تتعامل مع استجابة requires2FA إطلاقًا،
// فكان مالك النظام (OWNER) عاجزًا عمليًا عن تسجيل الدخول من نموذج الواجهة
// نفسه رغم أن كل حساب OWNER يمر إلزاميًا بـ2FA. هذا الاختبار يثبت أن نفس
// الصفحة في الموقع العام تتعامل مع هذا التحدي بشكل صحيح.
describe('صفحة تسجيل الدخول — التعامل مع تحدي 2FA', () => {
  beforeEach(() => {
    pushMock.mockClear();
    (global as any).fetch = jest.fn();
  });

  it('يعرض خطوة إدخال رمز التحقق عند استلام requires2FA بدل التوجيه المباشر', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requires2FA: true, pendingToken: 'pending-abc' }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'owner@rawaya.test' } });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'P@ssw0rd123' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));

    await waitFor(() => expect(screen.getByText('التحقق الثنائي')).toBeInTheDocument());
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('لا يُوجَّه المستخدم لصفحة الحساب إلا بعد إرسال رمز 2FA بنجاح', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ requires2FA: true, pendingToken: 'pending-abc' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'real-token' }) });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'owner@rawaya.test' } });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'P@ssw0rd123' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));

    await waitFor(() => screen.getByText('التحقق الثنائي'));
    fireEvent.change(screen.getByLabelText('رمز التحقق'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'تأكيد' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/account'));
    expect(localStorage.getItem('rawaya_token')).toBe('real-token');
  });

  it('حساب عادي بلا 2FA يُوجَّه مباشرة لصفحة الحساب دون خطوة إضافية', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'direct-token' }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'user@rawaya.test' } });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'P@ssw0rd123' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/account'));
    expect(screen.queryByText('التحقق الثنائي')).not.toBeInTheDocument();
  });
});
