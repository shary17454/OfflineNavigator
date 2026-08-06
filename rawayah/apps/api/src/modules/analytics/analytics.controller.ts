import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
@Permissions('analytics:view')
export class AnalyticsController {
  constructor(private svc: AnalyticsService) {}

  @Get('overview')
  overview() {
    return this.svc.overview();
  }

  @Get('search/top-queries')
  topQueries(@Query('limit') limit?: string) {
    return this.svc.topSearchQueries(limit ? Number(limit) : undefined);
  }

  @Get('search/zero-results')
  zeroResults(@Query('limit') limit?: string) {
    return this.svc.zeroResultQueries(limit ? Number(limit) : undefined);
  }

  @Get('content/most-viewed-poems')
  mostViewedPoems(@Query('limit') limit?: string) {
    return this.svc.mostViewedPoems(limit ? Number(limit) : undefined);
  }

  @Get('users/growth')
  userGrowth(@Query('days') days?: string) {
    return this.svc.newUsersPerDay(days ? Number(days) : undefined);
  }
}
