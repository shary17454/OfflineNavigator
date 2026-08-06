import { BadRequestException } from '@nestjs/common';
import { StorageService } from '../src/shared/media/storage.service';

describe('StorageService.validate — فحص نوع الملفات وحجمها إلزاميًا (قسم 4/34/19)', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
  });

  it('يرفض نوع ملف غير مسموح لفئة الصور حتى لو كان الامتداد يوحي بذلك', () => {
    const file = { buffer: Buffer.alloc(1024), originalname: 'malware.jpg', mimetype: 'application/x-msdownload' };
    expect(() => service.validate(file, 'image')).toThrow(BadRequestException);
  });

  it('يقبل صورة JPEG ضمن الحد المسموح', () => {
    const file = { buffer: Buffer.alloc(1024), originalname: 'photo.jpg', mimetype: 'image/jpeg' };
    expect(() => service.validate(file, 'image')).not.toThrow();
  });

  it('يرفض صورة تتجاوز الحد الأقصى المسموح (10 ميجابايت)', () => {
    const file = { buffer: Buffer.alloc(11 * 1024 * 1024), originalname: 'huge.jpg', mimetype: 'image/jpeg' };
    expect(() => service.validate(file, 'image')).toThrow(/يتجاوز الحد الأقصى/);
  });

  it('يقبل فيديو MP4 ضمن حده الأقصى الأكبر (500 ميجابايت)', () => {
    const file = { buffer: Buffer.alloc(400 * 1024 * 1024), originalname: 'clip.mp4', mimetype: 'video/mp4' };
    expect(() => service.validate(file, 'video')).not.toThrow();
  });

  it('يرفض ملف صوت أُرسل بصيغة صورة (فئة خاطئة)', () => {
    const file = { buffer: Buffer.alloc(1024), originalname: 'track.mp3', mimetype: 'audio/mpeg' };
    expect(() => service.validate(file, 'image')).toThrow(BadRequestException);
  });

  it('يرفض مستند غير PDF ضمن فئة المستندات', () => {
    const file = { buffer: Buffer.alloc(1024), originalname: 'doc.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    expect(() => service.validate(file, 'document')).toThrow(BadRequestException);
  });
});
