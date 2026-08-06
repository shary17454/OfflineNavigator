import { clearToken, getToken, post, setToken } from './http';

describe('lib/http — إدارة التوكن ودالة post', () => {
  beforeEach(() => {
    localStorage.clear();
    (global as any).fetch = jest.fn();
  });

  it('setToken يُخزّن التوكن وgetToken يستعيده من مفتاح rawaya_token', () => {
    setToken('abc123');
    expect(localStorage.getItem('rawaya_token')).toBe('abc123');
    expect(getToken()).toBe('abc123');
  });

  it('clearToken يحذف التوكن فعليًا', () => {
    setToken('abc123');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('post يرفق رأس Authorization عند توفر توكن مخزَّن (withAuth الافتراضي true)', async () => {
    setToken('my-token');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await post('/auth/account/delete', { password: 'x' });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer my-token');
  });

  it('post لا يرفق Authorization عندما withAuth=false (تسجيل الدخول/التسجيل)', async () => {
    setToken('my-token');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });

    await post('/auth/login', { email: 'a@b.com', password: 'x' }, false);

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('post يرمي رسالة الخطأ الحقيقية القادمة من الخادم عند فشل الطلب', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'كلمة المرور غير صحيحة' }),
    });

    await expect(post('/auth/account/delete', { password: 'wrong' })).rejects.toThrow('كلمة المرور غير صحيحة');
  });
});
