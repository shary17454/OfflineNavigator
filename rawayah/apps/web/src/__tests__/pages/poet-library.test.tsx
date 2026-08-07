import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PoetLibraryPage from '../../pages/poets/[id]';

const routerMock = { query: { id: 'poet-1' } };
jest.mock('next/router', () => ({ useRouter: () => routerMock }));

const LIBRARY_RESPONSE = {
  poet: {
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
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  it('يفتح التبويب الأول تلقائيًا ويعرض ملاحظة اختلاف المصادر', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => LIBRARY_RESPONSE });

    render(<PoetLibraryPage />);

    await waitFor(() => expect(screen.getByText('أبو الفضل')).toBeInTheDocument());
    expect(screen.getByText(/اختلاف المصادر: اختلفت المصادر في سنة الوفاة/)).toBeInTheDocument();
    // دقة التاريخ التقريبية تُعرض صراحةً لا كتاريخ مؤكد.
    expect(screen.getByText(/الميلاد: نحو 1300/)).toBeInTheDocument();
  });

  it('لا يعرض تبويب "المكتبة" الفارغ — التبويبات القادمة من الخادم فقط', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => LIBRARY_RESPONSE });

    render(<PoetLibraryPage />);
    await waitFor(() => screen.getByText('أبو الفضل'));

    // الخادم لم يُرجع تبويب "الصوتيات" لأنه فارغ فعلًا.
    expect(screen.queryByText(/الصوتيات/)).not.toBeInTheDocument();
  });

  it('التبديل لتبويب اختلاف الروايات يعرض الروايتين معًا دون ترجيح', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => LIBRARY_RESPONSE });

    render(<PoetLibraryPage />);
    await waitFor(() => screen.getByText('أبو الفضل'));

    fireEvent.click(screen.getByText(/اختلاف الروايات/));

    expect(screen.getByText('رواية أهل نجد')).toBeInTheDocument();
    expect(screen.getByText('رواية أهل الحجاز')).toBeInTheDocument();
    expect(screen.getByText(/تُعرض الروايات كما وردت دون ترجيح/)).toBeInTheDocument();
  });

  it('يعرض رسالة واضحة عند شاعر غير موجود أو غير منشور', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    render(<PoetLibraryPage />);

    await waitFor(() => expect(screen.getByText('الشاعر غير موجود أو غير منشور.')).toBeInTheDocument());
  });
});
