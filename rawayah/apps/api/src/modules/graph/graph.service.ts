import { Injectable } from '@nestjs/common';
import { ContentType } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateRelationDto, UpsertTrustAssessmentDto } from './dto/graph.dto';

@Injectable()
export class GraphService {
  constructor(private prisma: PrismaService) {}

  async getRelations(type: ContentType, id: string) {
    const [asSource, asTarget] = await Promise.all([
      this.prisma.entityRelation.findMany({ where: { sourceType: type, sourceId: id } }),
      this.prisma.entityRelation.findMany({ where: { targetType: type, targetId: id } }),
    ]);

    return [
      ...asSource.map((r) => ({ ...r, direction: 'outgoing' as const, otherType: r.targetType, otherId: r.targetId })),
      ...asTarget.map((r) => ({ ...r, direction: 'incoming' as const, otherType: r.sourceType, otherId: r.sourceId })),
    ];
  }

  createRelation(dto: CreateRelationDto, createdBy?: string) {
    return this.prisma.entityRelation.create({
      data: {
        sourceType: dto.sourceType as ContentType,
        sourceId: dto.sourceId,
        targetType: dto.targetType as ContentType,
        targetId: dto.targetId,
        relationType: dto.relationType,
        label: dto.label,
        note: dto.note,
        createdBy,
      },
    });
  }

  deleteRelation(id: string) {
    return this.prisma.entityRelation.delete({ where: { id } });
  }

  getTrust(type: ContentType, id: string) {
    return this.prisma.trustAssessment.findUnique({ where: { contentType_contentId: { contentType: type, contentId: id } } });
  }

  upsertTrust(type: ContentType, id: string, dto: UpsertTrustAssessmentDto, reviewerId?: string) {
    return this.prisma.trustAssessment.upsert({
      where: { contentType_contentId: { contentType: type, contentId: id } },
      update: {
        score: dto.score,
        reasoning: dto.reasoning,
        sourceCount: dto.sourceCount ?? 0,
        sourceStrength: dto.sourceStrength,
        hasConflictingSources: dto.hasConflictingSources ?? false,
        isOralNarration: dto.isOralNarration ?? false,
        consensusStatus: dto.consensusStatus ?? 'AGREED',
        reviewedById: reviewerId,
        reviewedByName: dto.reviewedByName,
        lastReviewedAt: new Date(),
      },
      create: {
        contentType: type,
        contentId: id,
        score: dto.score,
        reasoning: dto.reasoning,
        sourceCount: dto.sourceCount ?? 0,
        sourceStrength: dto.sourceStrength,
        hasConflictingSources: dto.hasConflictingSources ?? false,
        isOralNarration: dto.isOralNarration ?? false,
        consensusStatus: dto.consensusStatus ?? 'AGREED',
        reviewedById: reviewerId,
        reviewedByName: dto.reviewedByName,
        lastReviewedAt: new Date(),
      },
    });
  }

  async explore(type: ContentType, id: string) {
    const [relations, trust] = await Promise.all([this.getRelations(type, id), this.getTrust(type, id)]);
    return { type, id, relations, trust };
  }
}
