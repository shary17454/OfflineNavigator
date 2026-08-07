import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AcceptPolicyDto, PublishPolicyVersionDto } from './dto/policies.dto';

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  // كل الوثائق النافذة — تستخدمها صفحات السياسات في التطبيق والموقع.
  listCurrent() {
    return this.prisma.policyDocument.findMany({
      where: { isCurrent: true },
      orderBy: { code: 'asc' },
      select: { id: true, code: true, version: true, titleAr: true, effectiveFrom: true },
    });
  }

  async getCurrent(code: string) {
    const doc = await this.prisma.policyDocument.findFirst({
      where: { code: code as any, isCurrent: true },
      select: {
        id: true,
        code: true,
        version: true,
        titleAr: true,
        bodyAr: true,
        effectiveFrom: true,
        requiresReacceptance: true,
      },
    });
    if (!doc) throw new NotFoundException('الوثيقة غير موجودة');
    return doc;
  }

  // سجل الإصدارات السابقة — يبقى محفوظًا ولا يُحذف.
  listVersions(code: string) {
    return this.prisma.policyDocument.findMany({
      where: { code: code as any },
      orderBy: { effectiveFrom: 'desc' },
      select: { id: true, version: true, titleAr: true, effectiveFrom: true, isCurrent: true },
    });
  }

  // نشر إصدار جديد: يُنزع وصف "النافذ" عن السابق ويُضاف للجديد،
  // مع بقاء النص القديم كاملًا في السجل.
  async publishVersion(dto: PublishPolicyVersionDto, userId: string) {
    const existing = await this.prisma.policyDocument.findUnique({
      where: { code_version: { code: dto.code as any, version: dto.version } },
    });
    if (existing) {
      throw new BadRequestException('هذا الإصدار موجود بالفعل — استخدم رقم إصدار جديد');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.policyDocument.updateMany({
        where: { code: dto.code as any, isCurrent: true },
        data: { isCurrent: false },
      });

      const doc = await tx.policyDocument.create({
        data: {
          code: dto.code as any,
          version: dto.version,
          titleAr: dto.titleAr,
          bodyAr: dto.bodyAr,
          isCurrent: true,
          requiresReacceptance: dto.requiresReacceptance ?? false,
          createdById: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'policy:publish_version',
          entity: 'PolicyDocument',
          entityId: doc.id,
          metadata: { code: dto.code, version: dto.version },
        },
      });

      return doc;
    });
  }

  async accept(userId: string, dto: AcceptPolicyDto) {
    const doc = await this.prisma.policyDocument.findUnique({ where: { id: dto.documentId } });
    if (!doc) throw new NotFoundException('الوثيقة غير موجودة');

    const now = new Date();
    await this.prisma.policyAcceptance.upsert({
      where: { userId_documentId: { userId, documentId: doc.id } },
      update: { acceptedAt: now },
      create: { userId, documentId: doc.id, acceptedAt: now },
    });

    await this.prisma.consentRecord.create({
      data: {
        userId,
        consentType: 'POLICY_ACCEPTANCE',
        documentVersion: doc.version,
        consentText: doc.bodyAr,
        grantedAt: now,
      },
    });

    return { accepted: true, code: doc.code, version: doc.version };
  }

  // الوثائق التي تتطلب قبولًا ولم يقبلها هذا المستخدم بعد.
  async pendingFor(userId: string) {
    const required = await this.prisma.policyDocument.findMany({
      where: { isCurrent: true, requiresReacceptance: true },
      select: { id: true, code: true, version: true, titleAr: true },
    });
    const accepted = await this.prisma.policyAcceptance.findMany({
      where: { userId, documentId: { in: required.map((d) => d.id) } },
      select: { documentId: true },
    });
    const acceptedIds = new Set(accepted.map((a) => a.documentId));
    return required.filter((d) => !acceptedIds.has(d.id));
  }
}
