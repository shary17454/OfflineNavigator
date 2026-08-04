import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async seed() {
    const roleSeeds = [
      ['GUEST', 'زائر'],
      ['USER', 'مستخدم'],
      ['CONTRIBUTOR', 'مساهم'],
      ['REVIEWER', 'مراجع'],
      ['EDITOR', 'محرر'],
      ['ADMIN', 'مدير'],
      ['SUPER_ADMIN', 'مشرف أعلى'],
    ];

    for (const [code, nameAr] of roleSeeds) {
      await this.prisma.role.upsert({
        where: { code },
        update: { nameAr },
        create: { code, nameAr, isSystem: true },
      });
    }

    const permSeeds = [
      ['content:submit', 'إرسال المحتوى'],
      ['content:review', 'مراجعة المحتوى'],
      ['content:publish', 'نشر المحتوى'],
      ['admin:read', 'الوصول للإدارة'],
      ['admin:write', 'تعديل المحتوى'],
    ];

    for (const [code, nameAr] of permSeeds) {
      await this.prisma.permission.upsert({
        where: { code },
        update: { nameAr },
        create: { code, nameAr, scope: 'content' },
      });
    }

    const [admin, reviewer, editor, contributor, user] = await Promise.all([
      this.prisma.role.findFirst({ where: { code: 'ADMIN' } }),
      this.prisma.role.findFirst({ where: { code: 'REVIEWER' } }),
      this.prisma.role.findFirst({ where: { code: 'EDITOR' } }),
      this.prisma.role.findFirst({ where: { code: 'CONTRIBUTOR' } }),
      this.prisma.role.findFirst({ where: { code: 'USER' } }),
    ]);

    await this.linkRoles(admin, ['content:submit', 'content:review', 'content:publish', 'admin:read', 'admin:write']);
    await this.linkRoles(reviewer, ['content:review']);
    await this.linkRoles(editor, ['content:publish']);
    await this.linkRoles(contributor, ['content:submit']);
    await this.linkRoles(user, ['admin:read']);

    return { ok: true };
  }

  async linkRoles(role: any, codes: string[]) {
    if (!role) return;
    const permissions: Array<{ id: string; code: string }> = await this.prisma.permission.findMany({
      select: { id: true, code: true },
    });
    for (const code of codes) {
      const permission = permissions.find((p: { id: string; code: string }) => p.code === code);
      if (!permission) continue;
      await this.prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  all() {
    return this.prisma.role.findMany({
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { nameAr: 'asc' },
    });
  }
}
