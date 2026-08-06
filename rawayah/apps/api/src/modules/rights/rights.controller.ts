import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { RightsService } from './rights.service';
import { UpsertRightsDto } from './dto/rights.dto';

@ApiTags('rights')
@Controller('rights')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
@Permissions('rights:manage')
export class RightsController {
  constructor(private svc: RightsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.svc.list(status);
  }

  @Get(':contentType/:contentId')
  getByContent(@Param('contentType') contentType: string, @Param('contentId') contentId: string) {
    return this.svc.getByContent(contentType, contentId);
  }

  @Post(':contentType/:contentId')
  upsert(
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
    @CurrentUser() user: any,
    @Body() dto: UpsertRightsDto,
  ) {
    return this.svc.upsert(contentType, contentId, dto, user.id);
  }
}
