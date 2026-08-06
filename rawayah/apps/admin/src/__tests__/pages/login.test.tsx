import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLogin from '../../pages/login';

// اختبار انحدار مباشر لخطأ حقيقي وُجد وأُصلح هذه الجلسة: هذه الصفحة بالذات
// كانت تفترض دائمًا وجود accessToken مباشرة في استجابة /auth/login، بلا أي
// تعامل مع requires2FA — وبما أن كل حساب OWNER يمر إلزاميًا بـ2FA، فهذا كان
// يعني عمليًا أن مالك النظام الحقيقي لا يقدر يسجّل دخوله من هذا النموذج
// إطلاقًا. هذا الاختبار يمنع تكرار هذا الخلل مستقبلاً.
describe('صفحة تسجيل دخول لوحة الإدارة — التعامل مع تحدي 2FA', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    localStorage.clear();
  });

  it('يعرض خطوة رمز التحقق عند استلام requires2FA بدل افتراض نجاح الدخول مباشرة', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requires2FA: true, pendingToken: 'pending-xyz' }),
    });

    render(<AdminLogin />);
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'owner@rawaya.test' } });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'P@ssw0rd123' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));

    await waitFor(() => expect(screen.getByText('التحقق الثنائي')).toBeInTheDocument());
    expect(localStorage.getItem('admin_access_token')).toBeNull();
  });

  it('يخزّن رمز الوصول الحقيقي فقط بعد نجاح التحقق الثنائي', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ requires2FA: true, pendingToken: 'pending-xyz' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'owner-real-token' }) });

    render(<AdminLogin />);
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'owner@rawaya.test' } });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'P@ssw0rd123' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));

    await waitFor(() => screen.getByText('التحقق الثنائي'));
    fireEvent.change(screen.getByLabelText('رمز التحقق'), { target: { value: '111222' } });
    fireEvent.click(screen.getByRole('button', { name: 'تأكيد' }));

    await waitFor(() => expect(localStorage.getItem('admin_access_token')).toBe('owner-real-token'));
  });

  it('يعرض رسالة خطأ واضحة عند رمز تحقق خاطئ دون تخزين أي توكن', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ requires2FA: true, pendingToken: 'pending-xyz' }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'رمز خاطئ' }) });

    render(<AdminLogin />);
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'owner@rawaya.test' } });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'P@ssw0rd123' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));

    await waitFor(() => screen.getByText('التحقق الثنائي'));
    fireEvent.change(screen.getByLabelText('رمز التحقق'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'تأكيد' }));

    await waitFor(() => expect(screen.getByText('رمز التحقق غير صحيح أو منتهي الصلاحية')).toBeInTheDocument());
    expect(localStorage.getItem('admin_access_token')).toBeNull();
  });
});
