import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { MediaService } from './media.service';

type UploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @Permissions('admin:write')
  @UseGuards(PermissionGuard)
  async upload(@CurrentUser() user: any, @UploadedFile() file: UploadedFile, @Body() body: { contentType: string; contentId: string; contentCategory: 'audio' | 'video' }) {
    if (!file) throw new ForbiddenException('الملف مطلوب');
    return this.media.upload(user.id, file, body);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.media.byId(id);
  }

  @Get()
  list(
    @Query('type') type?: 'audio' | 'video',
    @Query('contentType') contentType?: string,
    @Query('contentId') contentId?: string,
  ) {
    return this.media.list(type, contentType, contentId);
  }
}
