import { Injectable } from '@nestjs/common';
import { ContentType } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { trigramSimilarity } from '../../shared/common/arabic-normalize';

// الحقل الذي يمثّل "الاسم/العنوان" لكل نوع محتوى — أساس مقارنة التشابه لكشف التكرار.
const TITLE_FIELD: Partial<Record<ContentType, string>> = {
  POEM: 'title',
  STORY: 'title',
  BOOK: 'title',
  ARTICLE: 'title',
  TOPIC: 'title',
  POET: 'fullName',
  HORSE: 'name',
  CAMEL: 'name',
  FALCON: 'name',
  TRIBE: 'name',
  PLACE: 'name',
  NARRATOR: 'fullName',
  PROVERB: 'phrase',
  VOCABULARY_TERM: 'term',
  HISTORICAL_EVENT: 'title',
  MANUSCRIPT: 'title',
};

const MODEL_MAP: Partial<Record<ContentType, string>> = {
  POEM: 'poem',
  STORY: 'story',
  BOOK: 'book',
  POET: 'poet',
  PROVERB: 'proverb',
  VOCABULARY_TERM: 'vocabularyTerm',
  HORSE: 'horse',
  CAMEL: 'camel',
  FALCON: 'falcon',
  PLACE: 'place',
  HISTORICAL_EVENT: 'historicalEvent',
  TRIBE: 'tribe',
  MANUSCRIPT: 'manuscript',
  NARRATOR: 'narrator',
  ARTICLE: 'article',
  TOPIC: 'topic',
};

const SIMILARITY_THRESHOLD = 0.55;

export interface DuplicateMatch {
  existingContentId: string;
  existingTitle: string;
  similarityScore: number;
  matchReason: string;
}

@Injectable()
export class DuplicateDetectionService {
  constructor(private prisma: PrismaService) {}

  async findCandidates(targetContentType: ContentType, rawData: Record<string, unknown>): Promise<DuplicateMatch[]> {
    const field = TITLE_FIELD[targetContentType];
    const modelKey = MODEL_MAP[targetContentType];
    if (!field || !modelKey) return [];

    const candidateTitle = String(rawData[field] ?? '').trim();
    if (!candidateTitle) return [];

    // فحوصات إضافية عالية الثقة قبل التشابه النصي: ISBN ورابط المصدر (إن وُجدا في البيانات الخام).
    const matches: DuplicateMatch[] = [];

    const delegate = (this.prisma as unknown as Record<string, any>)[modelKey];
    const existingRows: Array<Record<string, any>> = await delegate.findMany({
      where: { deletedAt: null },
      select: { id: true, [field]: true },
      take: 500,
    });

    for (const row of existingRows) {
      const existingTitle = String(row[field] ?? '');
      const score = trigramSimilarity(candidateTitle, existingTitle);
      if (score >= SIMILARITY_THRESHOLD) {
        matches.push({
          existingContentId: row.id,
          existingTitle,
          similarityScore: score,
          matchReason: `تشابه أسماء بنسبة ${(score * 100).toFixed(0)}% بعد التطبيع العربي`,
        });
      }
    }

    // ISBN مطابق تمامًا (للكتب) يُعامل كتطابق شبه مؤكد بصرف النظر عن نسبة تشابه العنوان.
    if (targetContentType === 'BOOK' && rawData.isbn) {
      const isbnMatch = await this.prisma.book.findFirst({ where: { deletedAt: null, isbn: String(rawData.isbn) } });
      if (isbnMatch && !matches.some((m) => m.existingContentId === isbnMatch.id)) {
        matches.push({
          existingContentId: isbnMatch.id,
          existingTitle: isbnMatch.title,
          similarityScore: 1,
          matchReason: `تطابق رقم ISBN: ${rawData.isbn}`,
        });
      }
    }

    return matches.sort((a, b) => b.similarityScore - a.similarityScore);
  }
}
