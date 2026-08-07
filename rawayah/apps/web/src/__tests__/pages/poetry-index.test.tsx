import { render, screen, waitFor } from '@testing-library/react';
import PoetryIndex from '../../pages/poetry/index';

// يثبت أن أقسام الشعر تُبنى بالكامل من استجابة الخادم — لا نوع شعر واحد
// مكتوب في الصفحة نفسها، والأبعاد الفارغة لا تُعرض كعناوين بلا محتوى.
describe('صفحة أقسام الشعر — لا تصنيف ثابت في الواجهة', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  it('يعرض رسالة تحميل ثم الأقسام القادمة من الخادم فقط', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        dimensions: {
          TRADITION: [{ id: 't1', slug: 'nabati', nameAr: 'الشعر النبطي' }],
          THEME: [{ id: 't2', slug: 'ghazal', nameAr: 'شعر الغزل' }],
        },
        total: 2,
      }),
    });

    render(<PoetryIndex />);
    expect(screen.getByText('جارٍ التحميل…')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('الشعر النبطي')).toBeInTheDocument());
    expect(screen.getByText('شعر الغزل')).toBeInTheDocument();
    expect(screen.getByText('حسب نوع الشعر')).toBeInTheDocument();
    expect(screen.getByText('حسب الغرض والموضوع')).toBeInTheDocument();
  });

  it('لا يعرض عنوان بُعد ليس فيه أي تصنيف فعلي', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dimensions: { TRADITION: [{ id: 't1', slug: 'nabati', nameAr: 'الشعر النبطي' }] }, total: 1 }),
    });

    render(<PoetryIndex />);
    await waitFor(() => screen.getByText('الشعر النبطي'));

    expect(screen.queryByText('حسب العصر')).not.toBeInTheDocument();
    expect(screen.queryByText('حسب المنطقة')).not.toBeInTheDocument();
  });

  it('يعرض رسالة خطأ واضحة عند تعذّر الاتصال بالخادم', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'));

    render(<PoetryIndex />);
    await waitFor(() => expect(screen.getByText('تعذّر تحميل أقسام الشعر.')).toBeInTheDocument());
  });
});
