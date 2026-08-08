import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  // الموقع العام ولوحة المالك يستدعيان الـAPI من متصفح على دومين مختلف
  // في الإنتاج — بلا CORS يرفض المتصفح الطلب قبل وصوله للخادم أصلًا.
  // ALLOWED_ORIGINS غائب = وضع تطوير محلي، كل الأصول مسموحة.
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, stopAtFirstError: false }),
  );
  app.useStaticAssets(join(process.cwd(), '.rawaya-storage'), {
    prefix: '/assets',
  });

  const config = new DocumentBuilder()
    .setTitle('Rawaya API')
    .setDescription('منصة رواية الرقمية')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 4000);
}

bootstrap();
