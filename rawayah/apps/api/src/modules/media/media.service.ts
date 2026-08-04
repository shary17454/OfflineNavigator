import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { StorageService } from '../../shared/media/storage.service';

type UploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  async upload(uploaderId: string, file: UploadedFile, body: { contentType: string; contentId: string; contentCategory: 'audio' | 'video' }) {
    const saved = await this.storage.save(file, 'media');

    await this.prisma.mediaFile.create({
      data: {
        contentType: body.contentType as any,
        contentId: body.contentId,
        mimeType: saved.mimeType,
        url: saved.url,
        size: saved.size,
        originalName: saved.originalName,
        storageKey: saved.storageKey,
        uploadedBy: uploaderId,
      },
    });

    if (body.contentCategory === 'audio') {
      return this.prisma.audioTrack.create({
        data: {
          contentType: body.contentType as any,
          contentId: body.contentId,
          title: file.originalname || 'audio track',
          narrator: null,
          fileUrl: saved.url,
          durationMs: 0,
          license: null,
          isDownloadable: false,
        },
      });
    }

    return this.prisma.video.create({
      data: {
        contentType: body.contentType as any,
        contentId: body.contentId,
        title: file.originalname || 'video',
        fileUrl: saved.url,
        description: null,
        posterUrl: null,
        durationMs: null,
        subtitleUrl: null,
        license: null,
      },
    });
  }

  async list(type?: 'audio' | 'video', contentType?: string, contentId?: string) {
    const filter = contentType && contentId ? { contentType: contentType as any, contentId } : undefined;

    if (type === 'audio') {
      return this.prisma.audioTrack.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
      });
    }

    if (type === 'video') {
      return this.prisma.video.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
      });
    }

    const [audios, videos] = await Promise.all([
      this.prisma.audioTrack.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.video.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

    return { audios, videos };
  }

  byId(id: string) {
    return this.prisma.mediaFile.findUnique({ where: { id } });
  }
}
