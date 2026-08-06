import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentType } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateSuggestionDto, ReviewSuggestionDto } from './dto/suggestions.dto';

@Injectable()
export class SuggestionsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateSuggestionDto) {
    return this.prisma.contentSuggestion.create({
      data: {
        submittedById: userId,
        suggestionType: dto.suggestionType,
        contentType: dto.contentType as ContentType | undefined,
        contentId: dto.contentId,
        title: dto.title,
        body: dto.body,
        proposedSourceId: dto.proposedSourceId,
      },
    });
  }

  listPending() {
    return this.prisma.contentSuggestion.findMany({
      where: { status: 'PENDING' },
      include: { submittedBy: { select: { profile: true, email: true } }, proposedSource: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async review(id: string, reviewerId: string, dto: ReviewSuggestionDto) {
    const existing = await this.prisma.contentSuggestion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('الاقتراح غير موجود');

    return this.prisma.contentSuggestion.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNote: dto.reviewNote,
      },
    });
  }
}
