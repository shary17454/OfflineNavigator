import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { IngestionService } from './ingestion.service';
import {
  CreateIngestionJobDto,
  CreateIngestionSourceDto,
  PublishBatchDto,
  RejectRecordDto,
  ResolveDuplicateDto,
  StageRecordsDto,
} from './dto/ingestion.dto';

@ApiTags('ingestion')
@Controller('ingestion')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class IngestionController {
  constructor(private svc: IngestionService) {}

  @Get('sources')
  @Permissions('sources:manage')
  listSources() {
    return this.svc.listSources();
  }

  @Post('sources')
  @Permissions('sources:manage')
  createSource(@Body() dto: CreateIngestionSourceDto) {
    return this.svc.createSource(dto);
  }

  @Post('sources/:id/approve')
  @Permissions('sources:manage')
  approveSource(@Param('id') id: string) {
    return this.svc.approveSource(id);
  }

  @Get('jobs')
  @Permissions('content:import')
  listJobs() {
    return this.svc.listJobs();
  }

  @Post('jobs')
  @Permissions('content:import')
  createJob(@Body() dto: CreateIngestionJobDto, @CurrentUser() user: any) {
    return this.svc.createJob(dto, user.id);
  }

  // معاينة قبل الاستيراد: يُدخل السجلات في المرحلة الأولى ويُشغّل التطبيع وكشف التكرار وفحص المصدر،
  // ويتوقف عند "قيد المراجعة البشرية" — لا ينشئ أي محتوى فعلي بعد.
  @Post('jobs/:id/stage')
  @Permissions('content:import')
  stage(@Param('id') id: string, @Body() dto: StageRecordsDto) {
    return this.svc.stageRecords(id, dto.records);
  }

  @Get('records')
  @Permissions('content:import')
  listRecords(@Query('jobId') jobId?: string, @Query('stage') stage?: string) {
    return this.svc.listRecords(jobId, stage);
  }

  @Post('records/:id/approve')
  @Permissions('content:import')
  approveRecord(@Param('id') id: string) {
    return this.svc.approveRecord(id);
  }

  @Post('records/:id/reject')
  @Permissions('content:import')
  rejectRecord(@Param('id') id: string, @Body() dto: RejectRecordDto) {
    return this.svc.rejectRecord(id, dto);
  }

  @Post('duplicates/:id/resolve')
  @Permissions('content:merge')
  resolveDuplicate(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: ResolveDuplicateDto) {
    return this.svc.resolveDuplicate(id, user.id, dto);
  }

  @Post('batches/publish')
  @Permissions('content:import')
  publishBatch(@Body() dto: PublishBatchDto, @CurrentUser() user: any) {
    return this.svc.publishBatch(dto, user.id);
  }

  @Post('batches/:id/rollback')
  @Permissions('content:import')
  rollbackBatch(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.rollbackBatch(id, user.id);
  }
}
