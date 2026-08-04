import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        profile: true,
      },
    });
  }

  all(_: string) {
    return this.prisma.user.findMany({
      include: {
        profile: true,
        userRoles: { include: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  byId(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        userRoles: { include: { role: true } },
      },
    });
  }

  updateStatus(id: string, status: 'ACTIVE' | 'BANNED' | 'SUSPENDED' | 'DELETED') {
    return this.prisma.user.update({ where: { id }, data: { status } });
  }

  updateMe(userId: string, dto: UpdateProfileDto) {
    return this.prisma.profile.update({
      where: { userId },
      data: { fullName: dto.fullName, bio: dto.bio, location: dto.location },
    });
  }
}
