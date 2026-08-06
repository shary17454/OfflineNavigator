import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UpsertSettingDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
  }

  get(key: string) {
    return this.prisma.appSetting.findUnique({ where: { key } });
  }

  upsert(dto: UpsertSettingDto) {
    const scope = dto.scope || 'global';
    return this.prisma.appSetting.upsert({
      where: { key: dto.key },
      create: { key: dto.key, value: dto.value as any, scope },
      update: { value: dto.value as any, scope },
    });
  }
}
