import { Module } from '@nestjs/common';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { SourceConflictsController } from './source-conflicts.controller';
import { SourceConflictsService } from './source-conflicts.service';

@Module({
  controllers: [SourcesController, SourceConflictsController],
  providers: [SourcesService, SourceConflictsService],
  exports: [SourceConflictsService],
})
export class SourcesModule {}
