import { render, screen } from '@testing-library/react';
import ProverbsPage from '../../pages/proverbs/index';
import VocabularyPage from '../../pages/vocabulary/index';
import HorsesPage from '../../pages/horses/index';
import ProverbDetail from '../../pages/proverbs/[id]';
import PlaceDetail from '../../pages/places/[id]';

/**
 * اختبارات صفحات المحتوى المُصيَّرة على الخادم.
 *
 * الصفحات الآن تتلقّى بياناتها كخصائص جاهزة (props) من
 * `getServerSideProps` لا تجلبها في المتصفح، فالاختبار يمرّرها مباشرة
 * بلا محاكاة `fetch`.
 *
 * أهم ما تحرسه: **التمييز بين "تعطّل الخادم" و"لا يوجد محتوى"**. الحالتان
 * تنتجان قائمة فارغة، وعرضهما برسالة واحدة كان سيخفي عطلًا حقيقيًا خلف
 * رسالة تبدو طبيعية تمامًا — وهو خطأ يصعب اكتشافه في الإنتاج.
 */
describe('صفحات المحتوى المُصيَّرة على الخادم', () => {
  it('تعرض المواد القادمة من الخادم مع مستوى توثيق كل مادة', () => {
    render(
      <ProverbsPage
        failed={false}
        items={[
          {
            id: 'p1',
            phrase: 'الصيف ضيّعتِ اللبن',
            explanation: 'يُضرب لمن فرّط في وقته',
            region: 'نجد',
            verificationLevel: 'VERIFIED',
          },
        ]}
      />,
    );

    expect(screen.getByText('الصيف ضيّعتِ اللبن')).toBeInTheDocument();
    expect(screen.getByText(/يُضرب لمن فرّط/)).toBeInTheDocument();
    expect(screen.getByText(/موثّقة/)).toBeInTheDocument();
  });

  it('تعرض «قيد المراجعة» عند غياب مستوى التوثيق بدل إخفائه', () => {
    render(<VocabularyPage failed={false} items={[{ id: 'v1', term: 'مصطلح', meaning: 'معناه' }]} />);

    // إخفاء المستوى يجعل مادة غير مؤكدة تبدو مؤكدة — تُعرض الحالة صراحةً.
    expect(screen.getByText(/قيد المراجعة/)).toBeInTheDocument();
  });

  it('تفرّق بين تعطّل الخادم وعدم وجود محتوى', () => {
    const { unmount } = render(<HorsesPage failed items={[]} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/تعذّر الاتصال بالخادم/);
    unmount();

    render(<HorsesPage failed={false} items={[]} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText(/لا توجد مواد منشورة/)).toBeInTheDocument();
  });

  it('صفحة التفصيل تميّز المادة غير الموجودة عن عطل الخادم', () => {
    const { unmount } = render(<ProverbDetail failed={false} item={null} />);
    expect(screen.getByText(/غير موجودة أو لم تُنشر بعد/)).toBeInTheDocument();
    unmount();

    render(<ProverbDetail failed item={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/تعذّر الاتصال بالخادم/);
  });

  it('صفحة التفصيل تعرض الحقول المتوفرة فقط ولا تطبع صفوفًا فارغة', () => {
    render(
      <ProverbDetail
        failed={false}
        item={{ id: 'p1', phrase: 'مثل', explanation: 'شرحه', region: null, story: null }}
      />,
    );

    expect(screen.getByText('شرحه')).toBeInTheDocument();
    expect(screen.queryByText(/المنطقة:/)).toBeNull();
    expect(screen.queryByText(/قصة المثل/)).toBeNull();
  });

  it('الإحداثيات لا تُعرض إلا مكتملة — خط عرض وحده لا يحدد موضعًا', () => {
    const { unmount } = render(
      <PlaceDetail failed={false} item={{ id: 'x', name: 'مكان', latitude: 24.7, longitude: null }} />,
    );
    expect(screen.queryByText(/الإحداثيات/)).toBeNull();
    unmount();

    render(
      <PlaceDetail failed={false} item={{ id: 'x', name: 'مكان', latitude: 24.7, longitude: 46.6 }} />,
    );
    expect(screen.getByText(/الإحداثيات/)).toBeInTheDocument();
  });
});
