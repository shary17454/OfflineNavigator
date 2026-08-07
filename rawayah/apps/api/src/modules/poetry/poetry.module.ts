import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { StorageService } from '../../shared/media/storage.service';
import { PoetryController } from './poetry.controller';
import { PoetryService } from './poetry.service';

@Module({
  imports: [PrismaModule],
  controllers: [PoetryController],
  providers: [PoetryService, StorageService],
})
export class PoetryModule {}
