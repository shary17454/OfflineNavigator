import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { GraphService } from './graph.service';
import { CreateRelationDto, UpsertTrustAssessmentDto } from './dto/graph.dto';

@ApiTags('graph')
@Controller('graph')
export class GraphController {
  constructor(private svc: GraphService) {}

  @Get(':type/:id')
  explore(@Param('type') type: string, @Param('id') id: string) {
    return this.svc.explore(type as ContentType, id);
  }

  @Get(':type/:id/relations')
  relations(@Param('type') type: string, @Param('id') id: string) {
    return this.svc.getRelations(type as ContentType, id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:review')
  @Post('relations')
  createRelation(@CurrentUser() user: any, @Body() dto: CreateRelationDto) {
    return this.svc.createRelation(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:review')
  @Delete('relations/:id')
  deleteRelation(@Param('id') id: string) {
    return this.svc.deleteRelation(id);
  }

  @Get(':type/:id/trust')
  trust(@Param('type') type: string, @Param('id') id: string) {
    return this.svc.getTrust(type as ContentType, id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:review')
  @Post(':type/:id/trust')
  upsertTrust(
    @Param('type') type: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpsertTrustAssessmentDto,
  ) {
    return this.svc.upsertTrust(type as ContentType, id, dto, user.id);
  }
}
