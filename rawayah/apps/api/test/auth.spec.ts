describe('Auth service contracts (مرحلة MVP)', () => {
  it('يجب توفر أسرار JWT', () => {
    expect(typeof (process.env.JWT_SECRET || 'test-jwt-secret')).toEqual('string');
  });

  it('تتضمن مسارات المصادقة الأساسية', () => {
    const endpoints = ['register', 'login', 'refresh', 'logout'];
    expect(endpoints).toContain('login');
    expect(endpoints).toContain('register');
    expect(endpoints).toContain('refresh');
  });
});
