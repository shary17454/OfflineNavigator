import { render, screen } from '@testing-library/react';
import PoetryIndex from '../../pages/poetry/index';

// يثبت أن أقسام الشعر تُبنى بالكامل من بيانات الخادم — لا نوع شعر واحد
// مكتوب في الصفحة نفسها، والأبعاد الفارغة لا تُعرض كعناوين بلا محتوى.
//
// الصفحة الآن تُصيَّر على الخادم وتتلقى بياناتها كخصائص جاهزة من
// getServerSideProps، فالاختبار يمرّرها مباشرة بلا محاكاة fetch.
describe('صفحة أقسام الشعر — لا تصنيف ثابت في الواجهة', () => {
  it('يعرض الأقسام القادمة من الخادم فقط', () => {
    render(
      <PoetryIndex
        failed={false}
        data={{
          dimensions: {
            TRADITION: [{ id: 't1', slug: 'nabati', nameAr: 'الشعر النبطي' }],
            THEME: [{ id: 't2', slug: 'ghazal', nameAr: 'شعر الغزل' }],
          },
          total: 2,
        }}
      />,
    );

    expect(screen.getByText('الشعر النبطي')).toBeInTheDocument();
    expect(screen.getByText('شعر الغزل')).toBeInTheDocument();
    expect(screen.getByText('حسب نوع الشعر')).toBeInTheDocument();
    expect(screen.getByText('حسب الغرض والموضوع')).toBeInTheDocument();
  });

  it('لا يعرض عنوان بُعد ليس فيه أي تصنيف فعلي', () => {
    render(
      <PoetryIndex
        failed={false}
        data={{
          dimensions: { TRADITION: [{ id: 't1', slug: 'nabati', nameAr: 'الشعر النبطي' }] },
          total: 1,
        }}
      />,
    );

    expect(screen.queryByText('حسب العصر')).not.toBeInTheDocument();
    expect(screen.queryByText('حسب المنطقة')).not.toBeInTheDocument();
  });

  it('يعرض رسالة خطأ واضحة عند تعذّر الاتصال بالخادم', () => {
    render(<PoetryIndex failed data={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/تعذّر تحميل أقسام الشعر/);
  });
});
