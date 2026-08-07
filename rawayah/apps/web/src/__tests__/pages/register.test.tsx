import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../../pages/register';
import { getToken } from '../../lib/http';

const pushMock = jest.fn();
const routerMock = { push: pushMock };
jest.mock('next/router', () => ({ useRouter: () => routerMock }));

describe('صفحة إنشاء حساب جديد', () => {
  beforeEach(() => {
    pushMock.mockClear();
    localStorage.clear();
    (global as any).fetch = jest.fn();
  });

  it('عند النجاح: يخزّن التوكن الحقيقي المُعاد من الخادم ويُوجَّه لصفحة الحساب', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'real-access-token' }),
    });

    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('الاسم'), { target: { value: 'مستخدم جديد' } });
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'new@rawaya.test' } });
    fireEvent.change(screen.getByLabelText(/كلمة المرور/), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByText('إنشاء الحساب'));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/account'));
    expect(getToken()).toBe('real-access-token');
  });

  it('لا يُرسَل رمز مصادقة موجود مسبقًا مع طلب التسجيل نفسه', async () => {
    localStorage.setItem('rawaya_token', 'stale-token-from-before');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'x' }) });

    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/كلمة المرور/), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByText('إنشاء الحساب'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('عند فشل الخادم (بريد مستخدم مثلاً): يعرض رسالة الخادم ولا يُخزَّن أي توكن ولا يُوجَّه المستخدم', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'البريد الإلكتروني مستخدم بالفعل' }),
    });

    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'taken@rawaya.test' } });
    fireEvent.change(screen.getByLabelText(/كلمة المرور/), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByText('إنشاء الحساب'));

    await waitFor(() => expect(screen.getByText('البريد الإلكتروني مستخدم بالفعل')).toBeInTheDocument());
    expect(getToken()).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
