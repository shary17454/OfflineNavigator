import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ReadingListsService {
  constructor(private prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.readingList.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, body: { title: string; description?: string; isPublic?: boolean }) {
    return this.prisma.readingList.create({
      data: {
        userId,
        title: body.title,
        description: body.description,
        isPublic: Boolean(body.isPublic),
      },
    });
  }

  async addItem(userId: string, listId: string, body: { contentType: string; contentId: string }) {
    const owner = await this.prisma.readingList.findFirst({ where: { id: listId, userId } });
    if (!owner) throw new ForbiddenException('غير مصرح');

    return this.prisma.readingListItem.create({
      data: {
        readingListId: listId,
        contentType: body.contentType as any,
        contentId: body.contentId,
      },
    });
  }

  async removeItem(userId: string, listId: string, body: { contentType: string; contentId: string }) {
    const owner = await this.prisma.readingList.findFirst({ where: { id: listId, userId } });
    if (!owner) throw new ForbiddenException('غير مصرح');

    return this.prisma.readingListItem.deleteMany({
      where: {
        readingListId: listId,
        contentType: body.contentType as any,
        contentId: body.contentId,
      },
    });
  }
}
