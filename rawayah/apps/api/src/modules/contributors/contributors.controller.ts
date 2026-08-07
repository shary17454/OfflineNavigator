import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { ContributorsService } from './contributors.service';
import {
  ReviewContributorApplicationDto,
  SubmitContributorApplicationDto,
  WithdrawConsentDto,
} from './dto/contributors.dto';

@ApiTags('contributors')
@Controller('contributors')
export class ContributorsController {
  constructor(private svc: ContributorsService) {}

  // ---------- عام: دليل المساهمين المعتمدين (بيانات عامة فقط) ----------

  @Get('directory')
  directory(@Query('type') type?: string) {
    return this.svc.listPublicContributors(type);
  }

  @Get('directory/:id')
  publicProfile(@Param('id') id: string) {
    return this.svc.getPublicContributor(id);
  }

  // ---------- المستخدم المسجَّل ----------

  @Get('consent-preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  consentPreview(@Query('type') type: 'NARRATOR' | 'HISTORIAN') {
    return this.svc.getConsentPreview(type === 'HISTORIAN' ? 'HISTORIAN' : 'NARRATOR');
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  apply(@Body() dto: SubmitContributorApplicationDto, @CurrentUser() user: any) {
    return this.svc.submitApplication(user.id, dto);
  }

  @Get('my-applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myApplications(@CurrentUser() user: any) {
    return this.svc.myApplications(user.id);
  }

  @Get('my-public-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myPublicData(@CurrentUser() user: any) {
    return this.svc.myPublicFootprint(user.id);
  }

  @Post('withdraw-consent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  withdrawConsent(@Body() dto: WithdrawConsentDto, @CurrentUser() user: any) {
    return this.svc.withdrawConsent(user.id, dto);
  }

  // ---------- مراجعة المالك ----------

  @Get('applications')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('contributors:review')
  listApplications(@Query('status') status?: string) {
    return this.svc.listApplications(status);
  }

  @Get('applications/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('contributors:review')
  getApplication(@Param('id') id: string) {
    return this.svc.getApplication(id);
  }

  @Post('applications/:id/review')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('contributors:review')
  review(@Param('id') id: string, @Body() dto: ReviewContributorApplicationDto, @CurrentUser() user: any) {
    return this.svc.reviewApplication(id, dto, user.id);
  }
}
