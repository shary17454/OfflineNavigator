import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

// يتحقق من أن رسم تبعيات NestJS الكامل (كل الوحدات المسجّلة في AppModule)
// يُحل بلا أخطاء حقن — لا يحتاج قاعدة بيانات حية (Prisma يتصل بشكل كسول عند
// أول استعلام فعلي فقط، لا عند الإقلاع). يكتشف أخطاء استيراد/تبعيات دائرية
// لا يكشفها `nest build` وحده.
describe('AppModule — فحص إقلاع كامل', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
  });

  it('يبني كل الوحدات المسجّلة بلا أخطاء حقن تبعيات', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
