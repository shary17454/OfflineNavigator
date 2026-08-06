// فحص إقلاع يدوي: يتحقق من أن رسم تبعيات NestJS (DI graph) يُحل بلا أخطاء —
// يكتشف أخطاء تركيب الوحدات (استيرادات ناقصة، تبعيات دائرية) التي لا يكشفها
// `nest build` وحده (فحص TypeScript فقط، بلا تشغيل فعلي). لا يحتاج قاعدة بيانات حية.
// تشغيل: JWT_SECRET=x JWT_REFRESH_SECRET=y npx tsx test/boot-check.manual.ts
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

async function main() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  await moduleRef.close();
  console.log('BOOT_OK');
}

main().catch((err) => {
  console.error('BOOT_FAILED');
  console.error(err);
  process.exit(1);
});
