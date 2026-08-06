import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { ModerationService } from './moderation.service';
import { ModerationHideDto, ModerationPublishDto, ModerationReviewDto } from './dto/moderation.dto';

@ApiTags('moderation')
@Controller('content')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private svc: ModerationService) {}

  @Get('moderation/queue')
  @Permissions('content:review')
  queue(@Query('status') status?: 'SUBMITTED' | 'NEEDS_REVISION' | 'VERIFIED', @Query('type') type?: ContentType) {
    return this.svc.queue(status, type);
  }

  @Post(':type/:id/submit')
  @Permissions('content:submit')
  submit(@Param('type') type: ContentType, @Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.submit(type, id, user.id);
  }

  @Post(':type/:id/review')
  @Permissions('content:review')
  review(@Param('type') type: ContentType, @Param('id') id: string, @CurrentUser() user: any, @Body() dto: ModerationReviewDto) {
    return this.svc.review(type, id, user.id, dto.action, dto.note);
  }

  @Post(':type/:id/publish')
  @Permissions('content:publish')
  publish(@Param('type') type: ContentType, @Param('id') id: string, @CurrentUser() user: any, @Body() dto: ModerationPublishDto) {
    return this.svc.publish(type, id, user.id, dto.note);
  }

  @Post(':type/:id/hide')
  @Permissions('content:edit')
  hide(@Param('type') type: ContentType, @Param('id') id: string, @CurrentUser() user: any, @Body() dto: ModerationHideDto) {
    return this.svc.hide(type, id, user.id, dto.reason);
  }
}
