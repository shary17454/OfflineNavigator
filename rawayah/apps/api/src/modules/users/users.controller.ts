import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.svc.getMe(user.id);
  }

  @Get()
  @UseGuards(PermissionGuard)
  @Permissions('admin:read')
  all(@CurrentUser() user: any) {
    return this.svc.all(user.id);
  }

  @Get(':id')
  @UseGuards(PermissionGuard)
  @Permissions('admin:read')
  byId(@Param('id') id: string) {
    return this.svc.byId(id);
  }

  @Post(':id/activate')
  @UseGuards(PermissionGuard)
  @Permissions('users:manage')
  activate(@Param('id') id: string) {
    return this.svc.updateStatus(id, 'ACTIVE');
  }

  @Post(':id/ban')
  @UseGuards(PermissionGuard)
  @Permissions('users:manage')
  ban(@Param('id') id: string) {
    return this.svc.updateStatus(id, 'BANNED');
  }

  @Put('me')
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.svc.updateMe(user.id, dto);
  }
}
