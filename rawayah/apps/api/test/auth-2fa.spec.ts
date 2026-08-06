import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { generateSecret } from 'otplib';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';

describe('AuthService — فرض 2FA لحسابات OWNER (سيناريو 20)', () => {
  let service: AuthService;
  let jwt: JwtService;
  let prisma: any;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      refreshToken: { create: jest.fn().mockResolvedValue({}) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AuthService, { provide: PrismaService, useValue: prisma }, JwtService],
    }).compile();
    service = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  it('لا يصدر رمز وصول كامل لحساب OWNER قبل التحقق الثنائي', async () => {
    const passwordHash = await argon2.hash('P@ssw0rd123');
    prisma.user.findUnique.mockResolvedValue({
      id: 'owner-1',
      email: 'owner@rawaya.test',
      passwordHash,
      mustChangePassword: true,
      userRoles: [{ role: { code: 'OWNER' } }],
    });

    const result = await service.login({ email: 'owner@rawaya.test', password: 'P@ssw0rd123' });

    expect(result).toHaveProperty('requires2FA', true);
    expect(result).toHaveProperty('pendingToken');
    expect(result).not.toHaveProperty('accessToken');
  });

  it('يصدر رموزًا كاملة مباشرة لمستخدم عادي (بلا OWNER)', async () => {
    const passwordHash = await argon2.hash('P@ssw0rd123');
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@rawaya.test',
      passwordHash,
      mustChangePassword: false,
      userRoles: [{ role: { code: 'USER' } }],
    });
    prisma.user.update.mockResolvedValue({});

    const result = await service.login({ email: 'user@rawaya.test', password: 'P@ssw0rd123' });

    expect(result).toHaveProperty('accessToken');
    expect(result).not.toHaveProperty('requires2FA');
  });

  it('يرفض رمز 2FA خاطئًا', async () => {
    const secret = generateSecret();
    const pendingToken = await jwt.signAsync({ sub: 'owner-1', pending2fa: true }, { secret: process.env.JWT_SECRET, expiresIn: '5m' });
    prisma.user.findUnique.mockResolvedValue({ id: 'owner-1', twoFactorSecret: secret, mustChangePassword: false });

    await expect(service.verify2FA({ pendingToken, code: '000000' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('يرفض pendingToken لا يحمل علامة pending2fa (حماية من إساءة استخدام رمز عادي)', async () => {
    const forgedToken = await jwt.signAsync({ sub: 'owner-1' }, { secret: process.env.JWT_SECRET, expiresIn: '5m' });
    await expect(service.verify2FA({ pendingToken: forgedToken, code: '123456' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
