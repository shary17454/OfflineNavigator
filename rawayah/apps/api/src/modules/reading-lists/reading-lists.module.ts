import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { ReadingListsController } from './reading-lists.controller';
import { ReadingListsService } from './reading-lists.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReadingListsController],
  providers: [ReadingListsService],
})
export class ReadingListsModule {}
