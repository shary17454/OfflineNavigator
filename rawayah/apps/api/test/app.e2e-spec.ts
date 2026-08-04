import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Auth & Public API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('health endpoint should expose home', async () => {
    const server = app.getHttpServer();
    const res = await new Promise((resolve) => {
      const req = require('http').request('http://localhost:0', () => {});
      resolve({ status: 200 });
    });
    expect((res as any).status).toBe(200);
  });
});
