import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { ReadingListsService } from './reading-lists.service';

@ApiTags('reading-lists')
@Controller('reading-lists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReadingListsController {
  constructor(private readonly svc: ReadingListsService) {}

  @Get()
  listMine(@CurrentUser() user: any) {
    return this.svc.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: { title: string; description?: string; isPublic?: boolean }) {
    return this.svc.create(user.id, body);
  }

  @Post(':id/items')
  addItem(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { contentType: string; contentId: string }) {
    return this.svc.addItem(user.id, id, body);
  }

  @Delete(':id/items')
  removeItem(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { contentType: string; contentId: string }) {
    return this.svc.removeItem(user.id, id, body);
  }
}
