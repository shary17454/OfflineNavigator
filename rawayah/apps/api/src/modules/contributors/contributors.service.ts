import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  ReviewContributorApplicationDto,
  SubmitContributorApplicationDto,
  WithdrawConsentDto,
} from './dto/contributors.dto';

// الحقول العامة وحدها. تُستخدم في كل نقطة API عامة لضمان ألا تتسرب
// بيانات التحقق الخاصة (الهاتف، البريد، المؤهلات، الإثباتات) إطلاقًا.
const PUBLIC_SELECT = {
  id: true,
  type: true,
  publicDisplayName: true,
  publicBio: true,
  publicSpecialties: true,
  publicAvatarUrl: true,
  publicCountry: true,
  publicRegion: true,
  status: true,
} as const;

// نطاقات البيانات التي يوافق الراوي/المؤرخ صراحةً على نشرها.
const PUBLIC_SCOPES = [
  'publicDisplayName',
  'publicBio',
  'publicSpecialties',
  'publicAvatarUrl',
  'publicCountry',
  'publicRegion',
  'contributorRole',
  'publishedContributions',
];

@Injectable()
export class ContributorsService {
  constructor(private prisma: PrismaService) {}

  private consentTextFor(type: 'NARRATOR' | 'HISTORIAN') {
    const label = type === 'NARRATOR' ? 'راوٍ' : 'مؤرخ/باحث';
    return [
      `أوافق صراحةً على أن قبولي بصفة ${label} في منصة موروث قد يترتب عليه ظهور بيانات ملفي العام للعامة، وهي:`,
      '- الاسم العام المعتمد الذي اخترته.',
      '- صورتي الشخصية إذا اخترت نشرها.',
      '- النبذة التعريفية عني.',
      `- صفتي بوصفي ${label} معتمدًا في المنصة.`,
      '- مجالات تخصصي.',
      '- المواد المنشورة المنسوبة إليّ.',
      '',
      'وأقر بعلمي بأن بيانات التواصل الخاصة (البريد، الهاتف) ووثائق التحقق التي قدمتها',
      'لا تُنشر للعامة ولا تُعرض في أي واجهة عامة، وتبقى لأغراض التحقق فقط.',
      '',
      'وأعلم أن بإمكاني لاحقًا الاطلاع على بياناتي العامة الظاهرة وطلب تعديلها أو سحب موافقتي،',
      'وأن سحب الموافقة الأساسية قد يترتب عليه إيقاف صفة العضوية المهنية.',
    ].join('\n');
  }

  // تقديم طلب العضوية. يُسجَّل مع الموافقات الصريحة في نفس المعاملة
  // حتى لا يوجد طلب بلا سجل موافقة مقابل.
  async submitApplication(userId: string, dto: SubmitContributorApplicationDto) {
    const existing = await this.prisma.contributorApplication.findUnique({
      where: { userId_type: { userId, type: dto.type } },
    });
    if (existing && ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(existing.status)) {
      throw new BadRequestException('لديك طلب قائم أو معتمد بالفعل لهذا النوع من العضوية');
    }

    const agreement = await this.prisma.policyDocument.findFirst({
      where: { code: 'CONTRIBUTOR_AGREEMENT', isCurrent: true },
    });
    if (!agreement) {
      throw new BadRequestException('اتفاقية المساهم غير متاحة حاليًا — تعذّر إكمال الطلب');
    }

    const consentText = this.consentTextFor(dto.type);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const application = await tx.contributorApplication.upsert({
        where: { userId_type: { userId, type: dto.type } },
        update: {
          publicDisplayName: dto.publicDisplayName,
          publicBio: dto.publicBio,
          publicSpecialties: dto.publicSpecialties,
          publicAvatarUrl: dto.publicAvatarUrl,
          publicCountry: dto.publicCountry,
          publicRegion: dto.publicRegion,
          privateFullName: dto.privateFullName,
          privateEmail: dto.privateEmail,
          privatePhoneNumber: dto.privatePhoneNumber,
          privatePreferredContact: dto.privatePreferredContact,
          privateExperience: dto.privateExperience,
          privateKnowledgeSources: dto.privateKnowledgeSources,
          privateReliesOnOralTradition: dto.privateReliesOnOralTradition ?? false,
          privateHasRecordings: dto.privateHasRecordings ?? false,
          privateHasDocuments: dto.privateHasDocuments ?? false,
          privateCredentials: dto.privateCredentials,
          privatePublications: dto.privatePublications,
          privateProfessionalLinks: dto.privateProfessionalLinks,
          privateSampleWorkUrl: dto.privateSampleWorkUrl,
          status: 'SUBMITTED',
          submittedAt: now,
        },
        create: {
          userId,
          type: dto.type as any,
          publicDisplayName: dto.publicDisplayName,
          publicBio: dto.publicBio,
          publicSpecialties: dto.publicSpecialties,
          publicAvatarUrl: dto.publicAvatarUrl,
          publicCountry: dto.publicCountry,
          publicRegion: dto.publicRegion,
          privateFullName: dto.privateFullName,
          privateEmail: dto.privateEmail,
          privatePhoneNumber: dto.privatePhoneNumber,
          privatePreferredContact: dto.privatePreferredContact,
          privateExperience: dto.privateExperience,
          privateKnowledgeSources: dto.privateKnowledgeSources,
          privateReliesOnOralTradition: dto.privateReliesOnOralTradition ?? false,
          privateHasRecordings: dto.privateHasRecordings ?? false,
          privateHasDocuments: dto.privateHasDocuments ?? false,
          privateCredentials: dto.privateCredentials,
          privatePublications: dto.privatePublications,
          privateProfessionalLinks: dto.privateProfessionalLinks,
          privateSampleWorkUrl: dto.privateSampleWorkUrl,
          status: 'SUBMITTED',
          submittedAt: now,
        },
      });

      // سجل موافقة ظهور الملف العام — يُحفظ نص الموافقة كما عُرض.
      await tx.consentRecord.create({
        data: {
          userId,
          consentType: dto.type === 'NARRATOR' ? 'NARRATOR_PUBLIC_PROFILE' : 'HISTORIAN_PUBLIC_PROFILE',
          documentVersion: agreement.version,
          consentText,
          grantedScopes: PUBLIC_SCOPES,
          grantedAt: now,
        },
      });

      // سجل قبول اتفاقية المساهم — بنصها وإصدارها وقت القبول.
      await tx.consentRecord.create({
        data: {
          userId,
          consentType: 'CONTRIBUTOR_AGREEMENT',
          documentVersion: agreement.version,
          consentText: agreement.bodyAr,
          grantedAt: now,
        },
      });

      await tx.policyAcceptance.upsert({
        where: { userId_documentId: { userId, documentId: agreement.id } },
        update: { acceptedAt: now },
        create: { userId, documentId: agreement.id, acceptedAt: now },
      });

      return application;
    });
  }

  // نص الموافقة يُعرض للمستخدم قبل التقديم — لا خانة محددة مسبقًا.
  async getConsentPreview(type: 'NARRATOR' | 'HISTORIAN') {
    const agreement = await this.prisma.policyDocument.findFirst({
      where: { code: 'CONTRIBUTOR_AGREEMENT', isCurrent: true },
      select: { version: true, titleAr: true, bodyAr: true },
    });
    return {
      consentText: this.consentTextFor(type),
      grantedScopes: PUBLIC_SCOPES,
      agreement,
      preChecked: false,
    };
  }

  // طلب المستخدم نفسه — يرى بياناته كاملة لأنها بياناته هو.
  myApplications(userId: string) {
    return this.prisma.contributorApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // البيانات العامة الظاهرة عن المستخدم + موافقاته — متطلب صريح
  // بأن يعرف المساهم ما الظاهر عنه ويستطيع طلب تعديله.
  async myPublicFootprint(userId: string) {
    const approved = await this.prisma.contributorApplication.findMany({
      where: { userId, status: 'APPROVED' },
      select: PUBLIC_SELECT,
    });
    const consents = await this.prisma.consentRecord.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
      select: {
        id: true,
        consentType: true,
        documentVersion: true,
        grantedScopes: true,
        grantedAt: true,
        withdrawnAt: true,
        consentText: true,
      },
    });
    const published = await this.prisma.poetFileItem.count({
      where: { contributedById: userId, status: 'PUBLISHED' },
    });

    return { publicProfiles: approved, consents, publishedContributionsCount: published };
  }

  async withdrawConsent(userId: string, dto: WithdrawConsentDto) {
    const record = await this.prisma.consentRecord.findFirst({
      where: { userId, consentType: dto.consentType as any, withdrawnAt: null },
      orderBy: { grantedAt: 'desc' },
    });
    if (!record) throw new NotFoundException('لا توجد موافقة سارية من هذا النوع');

    const updated = await this.prisma.consentRecord.update({
      where: { id: record.id },
      data: { withdrawnAt: new Date(), withdrawnNote: dto.note },
    });

    // سحب موافقة ظهور الملف العام يوقف العضوية فورًا: لا يجوز إبقاء
    // الصفة العامة قائمة بلا موافقة سارية عليها.
    if (['NARRATOR_PUBLIC_PROFILE', 'HISTORIAN_PUBLIC_PROFILE'].includes(dto.consentType)) {
      const type = dto.consentType === 'NARRATOR_PUBLIC_PROFILE' ? 'NARRATOR' : 'HISTORIAN';
      const app = await this.prisma.contributorApplication.findUnique({
        where: { userId_type: { userId, type: type as any } },
      });
      if (app && app.status === 'APPROVED') {
        await this.prisma.contributorApplication.update({
          where: { id: app.id },
          data: { status: 'SUSPENDED', reviewNotes: 'أُوقفت تلقائيًا بعد سحب المستخدم موافقة الظهور العام' },
        });
        await this.revokeRole(userId, type);
      }
    }

    return updated;
  }

  // ---------- مراجعة المالك ----------

  listApplications(status?: string) {
    return this.prisma.contributorApplication.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { submittedAt: 'desc' },
      include: { user: { select: { id: true, email: true } } },
    });
  }

  async getApplication(id: string) {
    const app = await this.prisma.contributorApplication.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!app) throw new NotFoundException('الطلب غير موجود');
    return app;
  }

  private async grantRole(userId: string, type: 'NARRATOR' | 'HISTORIAN') {
    const role = await this.prisma.role.findUnique({ where: { code: type } });
    if (!role) throw new BadRequestException(`دور ${type} غير موجود — شغّل npm run seed`);
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });
  }

  private async revokeRole(userId: string, type: 'NARRATOR' | 'HISTORIAN') {
    const role = await this.prisma.role.findUnique({ where: { code: type } });
    if (!role) return;
    await this.prisma.userRole.deleteMany({ where: { userId, roleId: role.id } });
  }

  async reviewApplication(id: string, dto: ReviewContributorApplicationDto, reviewerId: string) {
    const app = await this.prisma.contributorApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('الطلب غير موجود');

    // القبول يتطلب وجود موافقة ظهور سارية — لا اعتماد بلا موافقة.
    if (dto.decision === 'APPROVED') {
      const consentType = app.type === 'NARRATOR' ? 'NARRATOR_PUBLIC_PROFILE' : 'HISTORIAN_PUBLIC_PROFILE';
      const consent = await this.prisma.consentRecord.findFirst({
        where: { userId: app.userId, consentType: consentType as any, withdrawnAt: null },
      });
      if (!consent) {
        throw new BadRequestException('لا يمكن اعتماد الطلب: لا توجد موافقة سارية على الظهور العام');
      }
      await this.grantRole(app.userId, app.type as any);
    }

    if (['REJECTED', 'SUSPENDED', 'REVOKED'].includes(dto.decision)) {
      await this.revokeRole(app.userId, app.type as any);
    }

    const updated = await this.prisma.contributorApplication.update({
      where: { id },
      data: {
        status: dto.decision as any,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes,
        infoRequestedNote: dto.infoRequestedNote,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: `contributor_application:${dto.decision.toLowerCase()}`,
        entity: 'ContributorApplication',
        entityId: id,
        metadata: { targetUserId: app.userId, type: app.type },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: app.userId,
        title: 'تحديث على طلب العضوية المهنية',
        message:
          dto.decision === 'APPROVED'
            ? 'تم اعتماد طلبك. يمكنك الآن إضافة المواد، وتبقى قيد مراجعة المالك قبل النشر.'
            : `تم تحديث حالة طلبك إلى: ${dto.decision}`,
        type: 'contributor_application',
      },
    });

    return updated;
  }

  // دليل الرواة والمؤرخين المعتمدين — بيانات عامة فقط.
  listPublicContributors(type?: string) {
    return this.prisma.contributorApplication.findMany({
      where: { status: 'APPROVED', ...(type ? { type: type as any } : {}) },
      select: PUBLIC_SELECT,
      orderBy: { publicDisplayName: 'asc' },
    });
  }

  async getPublicContributor(id: string) {
    const c = await this.prisma.contributorApplication.findFirst({
      where: { id, status: 'APPROVED' },
      select: PUBLIC_SELECT,
    });
    if (!c) throw new NotFoundException('المساهم غير موجود');
    return c;
  }
}
