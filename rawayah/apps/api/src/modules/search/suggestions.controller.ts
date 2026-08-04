import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './suggestions.service';

@Controller('search')
export class SuggestionsController {
  constructor(private readonly svc: SearchService) {}

  @Get('suggest')
  suggest(@Query('q') q?: string, @Query('type') type?: string) {
    return this.svc.suggest(q || '', type || 'general');
  }
}
