import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'node:path';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type UploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

export type MediaCategory = 'image' | 'audio' | 'video' | 'document';

// فحص نوع الملفات وحجمها إلزامي قبل أي رفع — لا تُقبل أي أنواع أخرى مهما
// كان امتداد الاسم، لأن الفحص يعتمد على mimetype الفعلي المُرسل لا الامتداد.
const ALLOWED_MIME_TYPES: Record<MediaCategory, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
  video: ['video/mp4', 'video/webm'],
  document: ['application/pdf'],
};

const MAX_SIZE_BYTES: Record<MediaCategory, number> = {
  image: 10 * 1024 * 1024,
  audio: 100 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  document: 25 * 1024 * 1024,
};

const SIGNED_URL_EXPIRY_SECONDS = {
  private: 60 * 15,
  public: 60 * 60 * 24,
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'rawaya-media';
    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'rawaya',
        secretAccessKey: process.env.S3_SECRET_KEY || 'rawaya12345',
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`تم إنشاء حاوية التخزين "${this.bucket}"`);
      } catch (err) {
        this.logger.error(`تعذّر التأكد من وجود حاوية التخزين "${this.bucket}": ${err}`);
      }
    }
  }

  validate(file: UploadedFile, category: MediaCategory) {
    const allowed = ALLOWED_MIME_TYPES[category];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        `نوع الملف "${file.mimetype}" غير مسموح لهذه الفئة (${category}). الأنواع المسموحة: ${allowed.join(', ')}`,
      );
    }
    const maxSize = MAX_SIZE_BYTES[category];
    if (file.buffer.length > maxSize) {
      throw new BadRequestException(
        `حجم الملف (${Math.round(file.buffer.length / 1024 / 1024)} ميجابايت) يتجاوز الحد الأقصى المسموح (${Math.round(maxSize / 1024 / 1024)} ميجابايت) لهذه الفئة`,
      );
    }
  }

  async save(file: UploadedFile, category: MediaCategory, folder = 'media') {
    this.validate(file, category);

    const fileExtension = path.extname(file.originalname || 'file') || '';
    const storageKey = `${folder}/${randomUUID()}${fileExtension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      storageKey,
      size: file.buffer.length,
      mimeType: file.mimetype || 'application/octet-stream',
      originalName: file.originalname || 'file',
    };
  }

  // رابط الوصول لا يُخزَّن دائمًا في قاعدة البيانات لأنه رابط موقَّع مؤقت
  // الصلاحية — يُحسب عند كل قراءة من storageKey (مصدر الحقيقة الوحيد).
  async getSignedDownloadUrl(storageKey: string, isPrivate: boolean): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: storageKey });
    const expiresIn = isPrivate ? SIGNED_URL_EXPIRY_SECONDS.private : SIGNED_URL_EXPIRY_SECONDS.public;
    return getSignedUrl(this.client, command, { expiresIn });
  }
}
