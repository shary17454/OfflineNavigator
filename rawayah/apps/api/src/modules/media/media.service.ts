import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { MediaCategory, StorageService } from '../../shared/media/storage.service';

type UploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

const ALLOWED_UPLOAD_CATEGORIES: Record<'audio' | 'video', true> = { audio: true, video: true };

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  async upload(
    uploaderId: string,
    file: UploadedFile,
    body: { contentType: string; contentId: string; contentCategory: MediaCategory; isPrivate?: boolean },
  ) {
    if (!(body.contentCategory in ALLOWED_UPLOAD_CATEGORIES)) {
      throw new BadRequestException(`فئة المحتوى "${body.contentCategory}" غير مدعومة للرفع`);
    }

    const saved = await this.storage.save(file, body.contentCategory);
    const isPrivate = Boolean(body.isPrivate);

    const mediaFile = await this.prisma.mediaFile.create({
      data: {
        contentType: body.contentType as any,
        contentId: body.contentId,
        mimeType: saved.mimeType,
        url: saved.storageKey,
        size: saved.size,
        originalName: saved.originalName,
        storageKey: saved.storageKey,
        uploadedBy: uploaderId,
        isPrivate,
      },
    });

    let record: any = mediaFile;

    if (body.contentCategory === 'audio') {
      record = await this.prisma.audioTrack.create({
        data: {
          contentType: body.contentType as any,
          contentId: body.contentId,
          title: file.originalname || 'audio track',
          narrator: null,
          fileUrl: saved.storageKey,
          durationMs: 0,
          license: null,
          isDownloadable: false,
        },
      });
    } else if (body.contentCategory === 'video') {
      record = await this.prisma.video.create({
        data: {
          contentType: body.contentType as any,
          contentId: body.contentId,
          title: file.originalname || 'video',
          fileUrl: saved.storageKey,
          description: null,
          posterUrl: null,
          durationMs: null,
          subtitleUrl: null,
          license: null,
        },
      });
    }

    return { ...record, mediaFileId: mediaFile.id, url: await this.storage.getSignedDownloadUrl(saved.storageKey, isPrivate) };
  }

  async list(type?: 'audio' | 'video', contentType?: string, contentId?: string) {
    const filter = contentType && contentId ? { contentType: contentType as any, contentId } : undefined;

    if (type === 'audio') {
      const rows = await this.prisma.audioTrack.findMany({ where: filter, orderBy: { createdAt: 'desc' } });
      return Promise.all(rows.map((r) => this.resolveTrackUrl(r)));
    }

    if (type === 'video') {
      const rows = await this.prisma.video.findMany({ where: filter, orderBy: { createdAt: 'desc' } });
      return Promise.all(rows.map((r) => this.resolveTrackUrl(r)));
    }

    const [audios, videos] = await Promise.all([
      this.prisma.audioTrack.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.video.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

    return {
      audios: await Promise.all(audios.map((r) => this.resolveTrackUrl(r))),
      videos: await Promise.all(videos.map((r) => this.resolveTrackUrl(r))),
    };
  }

  async byId(id: string) {
    const mediaFile = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (!mediaFile) return null;
    return { ...mediaFile, url: await this.storage.getSignedDownloadUrl(mediaFile.storageKey, mediaFile.isPrivate) };
  }

  // fileUrl على AudioTrack/Video يحمل مفتاح التخزين (storageKey) لا رابطًا
  // جاهزًا — الروابط الموقَّعة مؤقتة الصلاحية فلا تُحفظ في القاعدة، بل تُحسب
  // عند كل قراءة اعتمادًا على isPrivate لكل ملف مرتبط عبر MediaFile.
  private async resolveTrackUrl<T extends { fileUrl: string; contentType: string; contentId: string }>(record: T) {
    const mediaFile = await this.prisma.mediaFile.findFirst({
      where: { storageKey: record.fileUrl },
      select: { isPrivate: true },
    });
    const isPrivate = mediaFile?.isPrivate ?? false;
    return { ...record, fileUrl: await this.storage.getSignedDownloadUrl(record.fileUrl, isPrivate) };
  }
}
