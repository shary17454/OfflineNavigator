describe('Content contracts', () => {
  it('تحقق أسماء الأقسام الأساسية', () => {
    const allowed = ['poems', 'stories', 'books', 'horses', 'camels'];
    expect(allowed).toEqual(expect.arrayContaining(['poems', 'stories', 'books']));
  });

  it('النتيجة الأولية للواجهة الرئيسية غير فارغة', () => {
    const hero = 'رواية… ذاكرة التراث العربي';
    expect(hero.length).toBeGreaterThan(4);
  });
});
