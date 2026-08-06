import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Get('plans')
  plans() {
    return this.svc.plans();
  }

  @Post('subscribe')
  subscribe(@CurrentUser() user: any, @Body() body: { planCode: string; provider?: string }) {
    return this.svc.subscribe(user.id, body.planCode, body.provider || 'mock');
  }

  @Get('me')
  mySubscriptions(@CurrentUser() user: any) {
    return this.svc.mySubscriptions(user.id);
  }

  @UseGuards(PermissionGuard)
  @Permissions('settings:manage')
  @Post('plans')
  createPlan(@Body() body: { code: string; nameAr: string; priceCents: number; periodDays: number }) {
    return this.svc.createPlan(body);
  }
}
