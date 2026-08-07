import { Body, Controller, Get, Param, Post, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { PoetryService } from './poetry.service';
import {
  CreatePoetFileItemDto,
  CreateTaxonomyTermDto,
  MergeTaxonomyTermDto,
  ReorderTaxonomyDto,
  ReviewPoetFileItemDto,
  SetPoemTaxonomyDto,
  SetPoetFileItemRightsDto,
  UpdateTaxonomyTermDto,
  UpsertPoetFileDto,
} from './dto/poetry.dto';

@ApiTags('poetry')
@Controller()
export class PoetryController {
  constructor(private svc: PoetryService) {}

  // ---------- قراءة عامة ----------

  @Get('poetry/taxonomy')
  taxonomy(@Query('dimension') dimension?: string) {
    return this.svc.listTaxonomy(dimension);
  }

  @Get('poetry/taxonomy/:slug/poems')
  poemsByTerm(@Param('slug') slug: string) {
    return this.svc.listPoemsByTerm(slug);
  }

  @Get('poems/:id/taxonomy')
  poemTaxonomy(@Param('id') id: string) {
    return this.svc.getPoemTaxonomy(id);
  }

  @Get('poets/:id/library')
  poetLibrary(@Param('id') id: string) {
    return this.svc.getPublicPoetLibrary(id);
  }

  // ---------- إدارة التصنيفات: المالك حصرًا ----------

  @Get('poetry/taxonomy/manage/all')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('poetry:taxonomy_manage')
  taxonomyForOwner() {
    return this.svc.listTaxonomyForOwner();
  }

  @Post('poetry/taxonomy')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('poetry:taxonomy_manage')
  createTerm(@Body() dto: CreateTaxonomyTermDto) {
    return this.svc.createTaxonomyTerm(dto);
  }

  @Patch('poetry/taxonomy/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('poetry:taxonomy_manage')
  updateTerm(@Param('id') id: string, @Body() dto: UpdateTaxonomyTermDto) {
    return this.svc.updateTaxonomyTerm(id, dto);
  }

  @Post('poetry/taxonomy/:id/merge')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('poetry:taxonomy_manage')
  mergeTerm(@Param('id') id: string, @Body() dto: MergeTaxonomyTermDto) {
    return this.svc.mergeTaxonomyTerm(id, dto);
  }

  @Post('poetry/taxonomy/reorder')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('poetry:taxonomy_manage')
  reorder(@Body() dto: ReorderTaxonomyDto) {
    return this.svc.reorderTaxonomy(dto);
  }

  @Post('poems/:id/taxonomy')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:edit')
  setPoemTaxonomy(@Param('id') id: string, @Body() dto: SetPoemTaxonomyDto) {
    return this.svc.setPoemTaxonomy(id, dto);
  }

  // ---------- مكتبة الشاعر ----------

  @Post('poets/:id/library')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('poet_file:manage')
  upsertLibrary(@Param('id') id: string, @Body() dto: UpsertPoetFileDto, @CurrentUser() user: any) {
    return this.svc.upsertPoetFile(id, dto, user.id);
  }

  @Get('poets/:id/library/manage')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('poet_file:manage')
  ownerLibrary(@Param('id') id: string) {
    return this.svc.getOwnerPoetLibrary(id);
  }

  // الإضافة متاحة للمالك وللرواة والمؤرخين المعتمدين معًا.
  // المادة تبدأ DRAFT دائمًا، ولا تُنشر من هنا مهما كان الدور.
  @Post('poets/:id/library/items')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('poet_file:contribute')
  addItem(@Param('id') id: string, @Body() dto: CreatePoetFileItemDto, @CurrentUser() user: any) {
    return this.svc.addPoetFileItem(id, dto, user.id);
  }

  @Post('poetry/items/:itemId/submit')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('poet_file:contribute')
  submitItem(@Param('itemId') itemId: string, @CurrentUser() user: any) {
    return this.svc.submitPoetFileItem(itemId, user.id, false);
  }

  @Get('poetry/my-contributions')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('poet_file:contribute')
  myContributions(@CurrentUser() user: any) {
    return this.svc.listMyContributions(user.id);
  }

  // ---------- المراجعة والنشر: المالك حصرًا ----------

  @Get('poetry/pending-review')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('poet_file:manage')
  pendingReview() {
    return this.svc.listPendingReview();
  }

  @Post('poetry/items/:itemId/rights')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('rights:manage')
  setRights(@Param('itemId') itemId: string, @Body() dto: SetPoetFileItemRightsDto, @CurrentUser() user: any) {
    return this.svc.setPoetFileItemRights(itemId, dto, user.id);
  }

  @Post('poetry/items/:itemId/review')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:review')
  reviewItem(@Param('itemId') itemId: string, @Body() dto: ReviewPoetFileItemDto, @CurrentUser() user: any) {
    return this.svc.reviewPoetFileItem(itemId, dto, user.id);
  }

  @Post('poetry/items/:itemId/publish')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:publish')
  publishItem(@Param('itemId') itemId: string, @CurrentUser() user: any) {
    return this.svc.publishPoetFileItem(itemId, user.id);
  }
}
