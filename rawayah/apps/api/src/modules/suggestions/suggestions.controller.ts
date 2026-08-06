import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto, ReviewSuggestionDto } from './dto/suggestions.dto';

@ApiTags('suggestions')
@Controller('suggestions')
export class SuggestionsController {
  constructor(private svc: SuggestionsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateSuggestionDto) {
    return this.svc.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:review')
  @Get()
  listPending() {
    return this.svc.listPending();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:review')
  @Post(':id/review')
  review(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: ReviewSuggestionDto) {
    return this.svc.review(id, user.id, dto);
  }
}
