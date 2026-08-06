import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { SettingsService } from './settings.service';
import { UpsertSettingDto } from './dto/settings.dto';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
@Permissions('settings:manage')
export class SettingsController {
  constructor(private svc: SettingsService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.svc.get(key);
  }

  @Post()
  upsert(@Body() dto: UpsertSettingDto) {
    return this.svc.upsert(dto);
  }
}
