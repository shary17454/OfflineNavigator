import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateSourceDto, UpdateSourceDto } from './dto/sources.dto';

@Injectable()
export class SourcesService {
  constructor(private prisma: PrismaService) {}

  list(activeOnly = false) {
    return this.prisma.source.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ tier: 'asc' }, { title: 'asc' }],
    });
  }

  async get(id: string) {
    const source = await this.prisma.source.findUnique({ where: { id } });
    if (!source) throw new BadRequestException('المصدر غير موجود');
    return source;
  }

  create(dto: CreateSourceDto) {
    return this.prisma.source.create({ data: dto });
  }

  async update(id: string, dto: UpdateSourceDto) {
    await this.get(id);
    return this.prisma.source.update({ where: { id }, data: dto });
  }

  async setActive(id: string, isActive: boolean) {
    await this.get(id);
    return this.prisma.source.update({ where: { id }, data: { isActive } });
  }
}
