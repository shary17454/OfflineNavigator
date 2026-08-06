import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/shared/prisma/prisma.service';

describe('AuthService — حذف الحساب وتصدير البيانات (سياسة الخصوصية، قسم 20)', () => {
  let service: AuthService;
  let prisma: any;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      refreshToken: { deleteMany: jest.fn() },
      favorite: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      follow: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      notification: { deleteMany: jest.fn() },
      readingList: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      rating: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      contentReport: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      commentReport: { deleteMany: jest.fn() },
      profile: { deleteMany: jest.fn() },
      comment: { findMany: jest.fn().mockResolvedValue([]) },
      question: { findMany: jest.fn().mockResolvedValue([]) },
      answer: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn().mockResolvedValue([]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AuthService, { provide: PrismaService, useValue: prisma }, JwtService],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('deleteAccount', () => {
    it('يرفض الحذف بكلمة مرور خاطئة ولا يبدأ أي معاملة حذف', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: await argon2.hash('CorrectPass1'),
        userRoles: [{ role: { code: 'USER' } }],
      });

      await expect(service.deleteAccount('u1', { password: 'WrongPass1' })).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('يرفض حذف حساب OWNER عبر هذا المسار حتى بكلمة مرور صحيحة', async () => {
      const passwordHash = await argon2.hash('OwnerPass1');
      prisma.user.findUnique.mockResolvedValue({
        id: 'owner-1',
        passwordHash,
        userRoles: [{ role: { code: 'OWNER' } }],
      });

      await expect(service.deleteAccount('owner-1', { password: 'OwnerPass1' })).rejects.toThrow('لا يمكن لحساب OWNER حذف نفسه');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('يحذف بيانات المستخدم العادي فعليًا ويُخفي هويته دون حذف صف المستخدم نفسه', async () => {
      const passwordHash = await argon2.hash('UserPass1');
      prisma.user.findUnique.mockResolvedValue({
        id: 'u2',
        passwordHash,
        userRoles: [{ role: { code: 'USER' } }],
      });

      const result = await service.deleteAccount('u2', { password: 'UserPass1' });

      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u2' } });
      expect(prisma.profile.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u2' } });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u2' },
        data: expect.objectContaining({
          status: 'DELETED',
          isEmailVerified: false,
          twoFactorSecret: null,
          twoFactorEnabled: false,
        }),
      });
      // لا يُستخدم Soft Delete وحده: البريد وكلمة المرور الفعليان يُنزعان لا يُخفيان فقط.
      const updateCall = prisma.user.update.mock.calls[0][0];
      expect(updateCall.data.email).not.toBe(undefined);
      expect(updateCall.data.email).toMatch(/^deleted-u2@/);
      expect(updateCall.data.passwordHash).not.toBe(passwordHash);
    });
  });

  describe('exportAccountData', () => {
    it('يرمي خطأً إن لم يوجد المستخدم', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.exportAccountData('missing')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('يُعيد بيانات الحساب الخاصة بالمستخدم فقط دون كلمة المرور', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u3',
        email: 'u3@example.com',
        passwordHash: 'should-not-leak',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
        lastLoginAt: null,
        profile: { displayName: 'مستخدم ثالث' },
      });

      const result = await service.exportAccountData('u3');

      expect(result.account).toEqual({
        id: 'u3',
        email: 'u3@example.com',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
        lastLoginAt: null,
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(result)).not.toContain('should-not-leak');
    });
  });
});
