import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { StorageService } from '../../shared/media/storage.service';

@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [MediaService, StorageService],
})
export class MediaModule {}
