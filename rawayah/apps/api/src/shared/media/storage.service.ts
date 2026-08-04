import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

type UploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Injectable()
export class StorageService {
  constructor() {}

  async save(file: UploadedFile, folder = 'media') {
    const fileExtension = path.extname(file.originalname || 'file') || '.bin';
    const fileName = `${randomUUID()}${fileExtension}`;
    const baseDir = path.join(process.cwd(), '.rawaya-storage', folder);
    await fs.mkdir(baseDir, { recursive: true });
    const filePath = path.join(baseDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    return {
      storageKey: `${folder}/${fileName}`,
      url: `/assets/${folder}/${fileName}`,
      size: file.buffer.length,
      mimeType: file.mimetype || 'application/octet-stream',
      originalName: file.originalname || 'file',
    };
  }

  async localUrl(filePath: string) {
    return `/assets/${filePath}`;
  }
}
