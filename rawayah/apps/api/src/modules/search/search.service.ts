import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  normalize(text: string) {
    return text.replace(/[إأآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ة/g, 'ه').trim();
  }
}
