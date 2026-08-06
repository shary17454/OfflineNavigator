import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UpsertRightsDto } from './dto/rights.dto';

@Injectable()
export class RightsService {
  constructor(private prisma: PrismaService) {}

  list(status?: string) {
    return this.prisma.rightsRecord.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { updatedAt: 'desc' },
    });
  }

  getByContent(contentType: string, contentId: string) {
    return this.prisma.rightsRecord.findUnique({
      where: { contentType_contentId: { contentType: contentType as any, contentId } },
    });
  }

  upsert(contentType: string, contentId: string, dto: UpsertRightsDto, userId?: string) {
    const data = {
      status: dto.status as any,
      licenseName: dto.licenseName,
      licenseUrl: dto.licenseUrl,
      permissionDocUrl: dto.permissionDocUrl,
      grantedByName: dto.grantedByName,
      grantedAt: dto.grantedAt ? new Date(dto.grantedAt) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      note: dto.note,
      recordedById: userId,
    };

    return this.prisma.rightsRecord.upsert({
      where: { contentType_contentId: { contentType: contentType as any, contentId } },
      create: { contentType: contentType as any, contentId, ...data },
      update: data,
    });
  }
}
