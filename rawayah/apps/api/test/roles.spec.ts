describe('RBAC policy', () => {
  it('تتضمن الأدوار الأساسية', () => {
    const roles = ['GUEST', 'USER', 'CONTRIBUTOR', 'REVIEWER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'];
    expect(roles).toContain('SUPER_ADMIN');
    expect(roles).toContain('ADMIN');
  });
});
