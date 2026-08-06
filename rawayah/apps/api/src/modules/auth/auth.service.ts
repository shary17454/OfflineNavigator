import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify as verifyOtp } from 'otplib';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ChangePasswordDto, LoginDto, RefreshDto, RegisterDto, Verify2FADto } from './dto/auth.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const existed = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existed) throw new UnauthorizedException('البريد الإلكتروني مسجل مسبقًا');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        profile: { create: { displayName: dto.displayName } },
      },
      include: { profile: true },
    });

    const role = await this.prisma.role.findFirst({ where: { code: 'USER' } });
    if (role) {
      await this.prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    }

    return this.issueTokens(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    const isOwner = user.userRoles.some((ur) => ur.role.code === 'OWNER');

    if (isOwner) {
      // حسابات OWNER تمر إلزاميًا بالتحقق الثنائي قبل صدور أي رمز وصول كامل.
      const pendingToken = await this.jwt.signAsync(
        { sub: user.id, pending2fa: true },
        { secret: process.env.JWT_SECRET, expiresIn: '5m' },
      );
      return { requires2FA: true, pendingToken };
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issueTokens(user.id);
    return { ...tokens, mustChangePassword: user.mustChangePassword };
  }

  async verify2FA(dto: Verify2FADto) {
    let payload: { sub: string; pending2fa?: boolean };
    try {
      payload = await this.jwt.verifyAsync(dto.pendingToken, { secret: process.env.JWT_SECRET });
    } catch {
      throw new UnauthorizedException('رمز الجلسة المؤقت غير صالح أو منتهي');
    }
    if (!payload.pending2fa) throw new UnauthorizedException('رمز غير صالح لهذا الغرض');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.twoFactorSecret) throw new UnauthorizedException('لم يتم إعداد المصادقة الثنائية لهذا الحساب');

    const result = await verifyOtp({ secret: user.twoFactorSecret, token: dto.code, epochTolerance: 1 });
    if (!result.valid) throw new UnauthorizedException('رمز التحقق غير صحيح');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), twoFactorEnabled: true },
    });

    const tokens = await this.issueTokens(user.id);
    return { ...tokens, mustChangePassword: user.mustChangePassword };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');
    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة');

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await argon2.hash(dto.newPassword), mustChangePassword: false },
    });
    return { success: true };
  }

  async refresh(dto: RefreshDto) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(dto.refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('رمز التحديث غير صالح');
    }

    const candidates = await this.prisma.refreshToken.findMany({ where: { userId: payload.sub, revokedAt: null } });
    if (!candidates.length) throw new UnauthorizedException('الرمز قديم أو ملغي');

    const active = await this.findMatchingRefreshToken(dto.refreshToken, candidates);
    if (!active) throw new UnauthorizedException('الرمز غير مطابق');

    const accessToken = await this.signAccess(payload.sub);
    const refreshToken = await this.signRefresh(payload.sub);

    await this.prisma.refreshToken.update({
      where: { id: active.id },
      data: {
        tokenHash: await argon2.hash(refreshToken),
        replacedBy: active.id,
      },
    });

    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }

  async logout(refreshToken: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { revokedAt: null },
    });

    for (const candidate of tokens) {
      const valid = await argon2.verify(candidate.tokenHash, refreshToken);
      if (valid) {
        await this.prisma.refreshToken.update({ where: { id: candidate.id }, data: { revokedAt: new Date() } });
        return { success: true };
      }
    }

    return { success: true };
  }

  private async findMatchingRefreshToken(token: string, candidates: { id: string; tokenHash: string }[]) {
    for (const candidate of candidates) {
      if (await argon2.verify(candidate.tokenHash, token)) return candidate;
    }
    return null;
  }

  private async signAccess(sub: string) {
    return this.jwt.signAsync({ sub }, { secret: process.env.JWT_SECRET, expiresIn: '15m' });
  }

  private async signRefresh(sub: string) {
    return this.jwt.signAsync({ sub }, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '30d' });
  }

  private async issueTokens(userId: string) {
    const accessToken = await this.signAccess(userId);
    const refreshToken = await this.signRefresh(userId);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: await argon2.hash(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }
}
