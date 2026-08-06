import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { DuplicateDetectionService } from './duplicate-detection.service';

@Module({
  controllers: [IngestionController],
  providers: [IngestionService, DuplicateDetectionService],
  exports: [DuplicateDetectionService],
})
export class IngestionModule {}
