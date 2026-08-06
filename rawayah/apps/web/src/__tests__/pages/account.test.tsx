import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountPage from '../../pages/account';
import { setToken } from '../../lib/http';

const pushMock = jest.fn();
// كائن مستقر (Stable reference) لازم: لو أعاد useRouter كائنًا جديدًا في
// كل استدعاء، فإن useEffect(() => {...}, [router]) في account.tsx سيُعاد
// تشغيله عند كل إعادة عرض (Re-render) بلا نهاية — يطابق سلوك useRouter
// الحقيقي في Next.js الذي يُعيد نفس المرجع عبر إعادات العرض.
const routerMock = { push: pushMock };
jest.mock('next/router', () => ({ useRouter: () => routerMock }));

const ME_RESPONSE = {
  id: 'u1',
  email: 'user@rawaya.test',
  status: 'ACTIVE',
  profile: { displayName: 'مستخدم تجربة' },
};

describe('صفحة الحساب — حذف الحساب وتصدير البيانات', () => {
  beforeEach(() => {
    pushMock.mockClear();
    localStorage.clear();
    (global as any).fetch = jest.fn();
  });

  it('يُوجَّه فورًا لصفحة الدخول عند عدم وجود توكن مخزَّن', () => {
    render(<AccountPage />);
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('يمنع محاولة الحذف بلا كلمة مرور — لا يُرسَل أي طلب حذف للخادم', async () => {
    setToken('valid-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ME_RESPONSE });

    render(<AccountPage />);
    await waitFor(() => screen.getByText('حذف حسابي'));
    fireEvent.click(screen.getByText('حذف حسابي'));
    fireEvent.click(screen.getByText('تأكيد الحذف النهائي'));

    await waitFor(() => expect(screen.getByText('يجب إدخال كلمة المرور لتأكيد الحذف')).toBeInTheDocument());
    // طلب واحد فقط حدث: GET /users/me — لا طلب حذف بلا كلمة مرور.
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('عند نجاح الحذف: يُمسح التوكن المحلي ويُوجَّه المستخدم للصفحة الرئيسية', async () => {
    setToken('valid-token');
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ME_RESPONSE })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    render(<AccountPage />);
    await waitFor(() => screen.getByText('حذف حسابي'));
    fireEvent.click(screen.getByText('حذف حسابي'));
    fireEvent.change(screen.getByLabelText('أدخل كلمة المرور للتأكيد'), { target: { value: 'MyRealPass1' } });
    fireEvent.click(screen.getByText('تأكيد الحذف النهائي'));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));
    expect(localStorage.getItem('rawaya_token')).toBeNull();
  });

  it('عند رفض الخادم للحذف (كلمة مرور خاطئة): لا يُمسح التوكن ويبقى المستخدم في الصفحة', async () => {
    setToken('valid-token');
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ME_RESPONSE })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'كلمة المرور غير صحيحة' }) });

    render(<AccountPage />);
    await waitFor(() => screen.getByText('حذف حسابي'));
    fireEvent.click(screen.getByText('حذف حسابي'));
    fireEvent.change(screen.getByLabelText('أدخل كلمة المرور للتأكيد'), { target: { value: 'WrongPass1' } });
    fireEvent.click(screen.getByText('تأكيد الحذف النهائي'));

    await waitFor(() => expect(screen.getByText('كلمة المرور غير صحيحة')).toBeInTheDocument());
    expect(localStorage.getItem('rawaya_token')).toBe('valid-token');
    expect(pushMock).not.toHaveBeenCalledWith('/');
  });
});
