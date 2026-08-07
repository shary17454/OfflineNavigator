import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { PoliciesService } from './policies.service';
import { AcceptPolicyDto, PublishPolicyVersionDto } from './dto/policies.dto';

@ApiTags('policies')
@Controller('policies')
export class PoliciesController {
  constructor(private svc: PoliciesService) {}

  // ---------- قراءة عامة ----------

  @Get()
  list() {
    return this.svc.listCurrent();
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  pending(@CurrentUser() user: any) {
    return this.svc.pendingFor(user.id);
  }

  @Get(':code')
  get(@Param('code') code: string) {
    return this.svc.getCurrent(code);
  }

  @Get(':code/versions')
  versions(@Param('code') code: string) {
    return this.svc.listVersions(code);
  }

  // ---------- المستخدم ----------

  @Post('accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  accept(@Body() dto: AcceptPolicyDto, @CurrentUser() user: any) {
    return this.svc.accept(user.id, dto);
  }

  // ---------- تحرير المالك ----------

  @Post('versions')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('policies:manage')
  publishVersion(@Body() dto: PublishPolicyVersionDto, @CurrentUser() user: any) {
    return this.svc.publishVersion(dto, user.id);
  }
}
