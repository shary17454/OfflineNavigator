import { render, screen, waitFor } from '@testing-library/react';
import PoetryTaxonomyAdmin from '../../pages/poetry-taxonomy';

describe('لوحة إدارة تصنيفات الشعر', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    localStorage.clear();
  });

  it('يطلب تسجيل الدخول عند عدم وجود جلسة مالك', () => {
    render(<PoetryTaxonomyAdmin />);
    expect(screen.getByText('يجب تسجيل الدخول.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('يعرض التصنيفات مجمَّعة حسب البُعد بعد تسجيل الدخول', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 't1', slug: 'nabati', nameAr: 'الشعر النبطي', dimension: 'TRADITION', sortOrder: 1, isActive: true },
        { id: 't2', slug: 'ghazal', nameAr: 'شعر الغزل', dimension: 'THEME', sortOrder: 1, isActive: true },
      ],
    });

    render(<PoetryTaxonomyAdmin />);

    await waitFor(() => expect(screen.getByText('الشعر النبطي')).toBeInTheDocument());
    // "شعر الغزل" يظهر مرتين فعلًا (الجدول وقائمة "التصنيف الأب" المنسدلة
    // لأن بُعد نموذج الإضافة الافتراضي THEME) — كلاهما صحيح، لا تعارض.
    expect(screen.getAllByText('شعر الغزل').length).toBeGreaterThan(0);
    // طلب القراءة أُرسل بترويسة تفويض المالك.
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer owner-token');
  });

  it('التصنيف المدموج يظهر معلَّمًا لا محذوفًا', async () => {
    localStorage.setItem('admin_access_token', 'owner-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 't1',
          slug: 'old-term',
          nameAr: 'تصنيف قديم',
          dimension: 'THEME',
          sortOrder: 1,
          isActive: false,
          mergedIntoId: 't2',
        },
      ],
    });

    render(<PoetryTaxonomyAdmin />);

    await waitFor(() => expect(screen.getByText(/تصنيف قديم/)).toBeInTheDocument());
    expect(screen.getByText(/\(مدموج\)/)).toBeInTheDocument();
  });
});
