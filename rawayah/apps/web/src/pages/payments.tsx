import { useEffect, useState } from 'react';

type Plan = {
  id: string;
  code: string;
  nameAr: string;
  priceCents: number;
  periodDays: number;
  features?: Record<string, unknown>;
};

export default function PaymentsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/payments/plans');
        if (res.ok) {
          const data = (await res.json()) as Plan[];
          setPlans(data || []);
        } else {
          setPlans([]);
        }
      } catch {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <main className="home">
        <p>جاري تحميل الخطط...</p>
      </main>
    );
  }

  return (
    <main className="home">
      <h1>الاشتراكات</h1>
      {plans.length === 0 ? (
        <p>لا توجد خطط متاحة الآن.</p>
      ) : (
        <ul>
          {plans.map((plan) => (
            <li key={plan.id}>
              <h3>{plan.nameAr}</h3>
              <p>الكود: {plan.code}</p>
              <p>السعر: {plan.priceCents / 100} ر.س</p>
              <p>مدة الاشتراك: {plan.periodDays} يوم</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
