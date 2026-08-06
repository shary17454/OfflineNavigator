import { Module } from '@nestjs/common';
import { ModerationModule } from '../moderation/moderation.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({ imports: [ModerationModule], controllers: [ContentController], providers: [ContentService] })
export class ContentModule {}
