import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { SourceConflictsService } from './source-conflicts.service';
import { CreateSourceConflictDto, ResolveSourceConflictDto } from './dto/source-conflicts.dto';

@ApiTags('source-conflicts')
@Controller('source-conflicts')
export class SourceConflictsController {
  constructor(private svc: SourceConflictsService) {}

  /// ما يُعرض للقارئ: مواضع الخلاف القائمة على مادة بعينها، بلا ملاحظات
  /// المراجع الداخلية. هذه النقطة وحدها عامة.
  @Get('public')
  publicNotes(@Query('contentType') contentType: ContentType, @Query('contentId') contentId: string) {
    return this.svc.publicNotesFor(contentType, contentId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('sources:manage')
  @Get()
  list(
    @Query('contentType') contentType?: ContentType,
    @Query('contentId') contentId?: string,
    @Query('pendingOnly') pendingOnly?: string,
  ) {
    return this.svc.list({ contentType, contentId, pendingOnly: pendingOnly === 'true' });
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('sources:manage')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('sources:manage')
  @Post()
  create(@Body() dto: CreateSourceConflictDto) {
    return this.svc.create(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('sources:manage')
  @Post(':id/resolve')
  resolve(@Param('id') id: string, @Body() dto: ResolveSourceConflictDto, @CurrentUser() user: any) {
    return this.svc.resolve(id, dto, user.id);
  }
}
