import { render, screen, fireEvent } from '@testing-library/react';
import PoetLibraryPage from '../../pages/poets/[id]';

const LIBRARY_RESPONSE = {
  poet: {
    id: 'poet-1',
    fullName: 'أبو الفضل',
    knownAs: 'شاعر البادية',
    disputeNote: 'اختلفت المصادر في سنة الوفاة',
    birthDate: '1300',
    birthDatePrecision: 'APPROXIMATE',
  },
  nameVariants: [],
  overview: null,
  tabs: [
    { key: 'overview', label: 'نبذة', count: 1 },
    { key: 'narrations', label: 'اختلاف الروايات', count: 1 },
  ],
  poems: [],
  texts: [],
  audios: [],
  videos: [],
  images: [],
  documents: [],
  links: [],
  stories: [],
  narrationGroups: [
    {
      subjectTitle: 'قصيدة مختارة 1',
      narrations: [
        { id: 'n1', label: 'رواية أهل نجد', body: 'النص كما يُروى في نجد', verificationLevel: 'ORAL' },
        { id: 'n2', label: 'رواية أهل الحجاز', body: 'النص كما يُروى في الحجاز', verificationLevel: 'DISPUTED' },
      ],
    },
  ],
  sources: [],
};

// يثبت أن مكتبة الشاعر في الموقع العام تعرض التبويب الأول القادم من
// الخادم تلقائيًا، وأن اختلاف الروايات يُعرض دون ترجيح أي منها.
describe('صفحة مكتبة الشاعر العامة', () => {
  it('يفتح التبويب الأول تلقائيًا ويعرض ملاحظة اختلاف المصادر', () => {
    render(<PoetLibraryPage failed={false} data={LIBRARY_RESPONSE as any} />);

    expect(screen.getByText('أبو الفضل')).toBeInTheDocument();
    expect(screen.getByText(/اختلاف المصادر: اختلفت المصادر في سنة الوفاة/)).toBeInTheDocument();
    // دقة التاريخ التقريبية تُعرض صراحةً لا كتاريخ مؤكد.
    expect(screen.getByText(/الميلاد: نحو 1300/)).toBeInTheDocument();
  });

  it('لا يعرض تبويب "المكتبة" الفارغ — التبويبات القادمة من الخادم فقط', () => {
    render(<PoetLibraryPage failed={false} data={LIBRARY_RESPONSE as any} />);

    // الخادم لم يُرجع تبويب "الصوتيات" لأنه فارغ فعلًا.
    expect(screen.queryByText(/الصوتيات/)).not.toBeInTheDocument();
  });

  it('التبديل لتبويب اختلاف الروايات يعرض الروايتين معًا دون ترجيح', () => {
    render(<PoetLibraryPage failed={false} data={LIBRARY_RESPONSE as any} />);

    fireEvent.click(screen.getByText(/اختلاف الروايات/));

    expect(screen.getByText('رواية أهل نجد')).toBeInTheDocument();
    expect(screen.getByText('رواية أهل الحجاز')).toBeInTheDocument();
    expect(screen.getByText(/تُعرض الروايات كما وردت دون ترجيح/)).toBeInTheDocument();
  });

  it('يعرض رسالة واضحة عند شاعر غير موجود أو غير منشور', () => {
    render(<PoetLibraryPage failed={false} data={null} />);
    expect(screen.getByText('الشاعر غير موجود أو غير منشور.')).toBeInTheDocument();
  });

  it('يميّز تعطّل الخادم عن الشاعر غير الموجود', () => {
    render(<PoetLibraryPage failed data={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/تعذّر الاتصال بالخادم/);
  });
});
