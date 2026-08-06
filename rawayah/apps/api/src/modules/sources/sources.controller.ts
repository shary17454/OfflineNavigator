import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { SourcesService } from './sources.service';
import { CreateSourceDto, UpdateSourceDto } from './dto/sources.dto';

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(private svc: SourcesService) {}

  @Get()
  list(@Query('activeOnly') activeOnly?: string) {
    return this.svc.list(activeOnly === 'true');
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('sources:manage')
  @Post()
  create(@Body() dto: CreateSourceDto) {
    return this.svc.create(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('sources:manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSourceDto) {
    return this.svc.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('sources:manage')
  @Post(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.svc.setActive(id, false);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('sources:manage')
  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.svc.setActive(id, true);
  }
}
