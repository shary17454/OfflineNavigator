import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { SearchService as SearchCoreService } from './search.service';
import { SuggestionsController } from './suggestions.controller';
import { SearchService as SearchSuggestionService } from './suggestions.service';

@Module({
  imports: [PrismaModule],
  controllers: [SuggestionsController],
  providers: [SearchCoreService, SearchSuggestionService],
})
export class SearchModule {}
