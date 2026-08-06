import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PermissionGuard } from '../src/shared/common/roles.guard';
import { PrismaService } from '../src/shared/prisma/prisma.service';

function makeContext(user: any, permissions: string[] | undefined) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(permissions) } as unknown as Reflector;
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  return { context, reflector };
}

describe('PermissionGuard — منع تجاوز الصلاحيات عبر API (سيناريو 19)', () => {
  let prisma: { userRole: { findMany: jest.Mock } };

  beforeEach(() => {
    prisma = { userRole: { findMany: jest.fn() } };
  });

  async function buildGuard(reflector: Reflector) {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        { provide: Reflector, useValue: reflector },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    return moduleRef.get(PermissionGuard);
  }

  it('يسمح بالمرور إذا لم يطلب المسار أي صلاحية', async () => {
    const { context, reflector } = makeContext({ id: 'u1' }, undefined);
    const guard = await buildGuard(reflector);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('يرفض مستخدمًا غير مسجّل حتى لو لم توجد صلاحية مطلوبة معروفة', async () => {
    const { context, reflector } = makeContext(undefined, ['content:create']);
    const guard = await buildGuard(reflector);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('يرفض مستخدمًا عاديًا (بلا أي أدوار) من إنشاء محتوى — content:create', async () => {
    prisma.userRole.findMany.mockResolvedValue([]); // USER عادي بلا أدوار ذات صلاحيات
    const { context, reflector } = makeContext({ id: 'u1' }, ['content:create']);
    const guard = await buildGuard(reflector);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('يسمح لمستخدم OWNER يملك صلاحية content:create فعليًا', async () => {
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [{ permission: { code: 'content:create' } }, { permission: { code: 'content:delete' } }],
        },
      },
    ]);
    const { context, reflector } = makeContext({ id: 'owner-1' }, ['content:create']);
    const guard = await buildGuard(reflector);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('يرفض إذا كان المستخدم يملك بعض الصلاحيات المطلوبة لا كلها (AND وليس OR)', async () => {
    prisma.userRole.findMany.mockResolvedValue([
      { role: { rolePermissions: [{ permission: { code: 'content:review' } }] } },
    ]);
    const { context, reflector } = makeContext({ id: 'reviewer-1' }, ['content:review', 'content:publish']);
    const guard = await buildGuard(reflector);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
