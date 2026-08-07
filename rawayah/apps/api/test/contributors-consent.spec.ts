import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { ContributorsService } from '../src/modules/contributors/contributors.service';
import { SubmitContributorApplicationDto } from '../src/modules/contributors/dto/contributors.dto';
import { PrismaService } from '../src/shared/prisma/prisma.service';

// اختبارات تثبّت متطلب الموافقة الصريحة والفصل بين البيانات العامة والخاصة.
describe('ContributorsService — الموافقة الصريحة وخصوصية بيانات التحقق', () => {
  let service: ContributorsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      contributorApplication: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
      consentRecord: { findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      policyDocument: { findFirst: jest.fn() },
      poetFileItem: { count: jest.fn() },
      role: { findUnique: jest.fn() },
      userRole: { upsert: jest.fn(), deleteMany: jest.fn() },
      auditLog: { create: jest.fn() },
      notification: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [ContributorsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ContributorsService);
  });

  describe('التحقق من الموافقة على مستوى الخادم', () => {
    // يستخدم ValidationPipe الحقيقي لا محاكاة — لأن الحماية الفعلية
    // تعتمد على @Equals(true)، ولا قيمة لاختبارها بمحاكاة.
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const meta = { type: 'body' as const, metatype: SubmitContributorApplicationDto };

    const base = {
      type: 'NARRATOR',
      publicDisplayName: 'راوي القصيم',
      publicBio: 'راوٍ متخصص في المرويات الشفهية بمنطقة القصيم منذ سنوات',
      publicSpecialties: 'الرواية الشفهية',
      privateFullName: 'عبدالله بن سعد',
      privateEmail: 'n@test.com',
      privateExperience: 'خمسة عشر عامًا في جمع المرويات',
    };

    it('يرفض الطلب إذا كانت موافقة الظهور العام false', async () => {
      await expect(
        pipe.transform({ ...base, publicDisplayConsent: false, contributorAgreementAccepted: true }, meta),
      ).rejects.toBeTruthy();
    });

    it('يرفض الطلب إذا لم تُقبل اتفاقية المساهم', async () => {
      await expect(
        pipe.transform({ ...base, publicDisplayConsent: true, contributorAgreementAccepted: false }, meta),
      ).rejects.toBeTruthy();
    });

    it('يرفض الطلب إذا كانت الموافقة غائبة تمامًا', async () => {
      await expect(pipe.transform({ ...base }, meta)).rejects.toBeTruthy();
    });

    it('يقبل الطلب عند الموافقة الصريحة على الاثنين', async () => {
      const out = await pipe.transform(
        { ...base, publicDisplayConsent: true, contributorAgreementAccepted: true },
        meta,
      );
      expect(out.publicDisplayConsent).toBe(true);
    });
  });

  describe('getConsentPreview', () => {
    it('يعيد preChecked = false — لا خانة اختيار محددة مسبقًا', async () => {
      prisma.policyDocument.findFirst.mockResolvedValue({ version: '1.0', titleAr: 'اتفاقية', bodyAr: 'نص' });
      const preview = await service.getConsentPreview('NARRATOR');
      expect(preview.preChecked).toBe(false);
      expect(preview.consentText).toContain('أوافق صراحةً');
      expect(preview.grantedScopes.length).toBeGreaterThan(0);
    });

    it('يوضح للراوي أن بيانات التواصل الخاصة لا تُنشر', async () => {
      prisma.policyDocument.findFirst.mockResolvedValue({ version: '1.0', titleAr: 'اتفاقية', bodyAr: 'نص' });
      const preview = await service.getConsentPreview('NARRATOR');
      expect(preview.consentText).toContain('لا تُنشر للعامة');
    });
  });

  describe('reviewApplication', () => {
    it('يرفض اعتماد طلب بلا موافقة ظهور سارية', async () => {
      prisma.contributorApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        userId: 'u1',
        type: 'NARRATOR',
      });
      prisma.consentRecord.findFirst.mockResolvedValue(null); // لا موافقة سارية
      await expect(service.reviewApplication('app-1', { decision: 'APPROVED' }, 'owner')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.userRole.upsert).not.toHaveBeenCalled();
    });

    it('يسحب الدور عند الرفض أو الإيقاف أو السحب', async () => {
      prisma.contributorApplication.findUnique.mockResolvedValue({ id: 'app-1', userId: 'u1', type: 'NARRATOR' });
      prisma.role.findUnique.mockResolvedValue({ id: 'role-narrator' });
      prisma.contributorApplication.update.mockResolvedValue({ id: 'app-1', status: 'REVOKED' });
      await service.reviewApplication('app-1', { decision: 'REVOKED' }, 'owner');
      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', roleId: 'role-narrator' },
      });
    });
  });

  describe('listPublicContributors — منع تسرب بيانات التحقق', () => {
    it('لا يطلب أي حقل private من قاعدة البيانات إطلاقًا', async () => {
      prisma.contributorApplication.findMany.mockResolvedValue([]);
      await service.listPublicContributors();
      const select = prisma.contributorApplication.findMany.mock.calls[0][0].select;
      const privateFields = Object.keys(select).filter((k) => k.startsWith('private'));
      expect(privateFields).toEqual([]);
      expect(select.publicDisplayName).toBe(true);
    });

    it('يقتصر على الطلبات المعتمدة فقط', async () => {
      prisma.contributorApplication.findMany.mockResolvedValue([]);
      await service.listPublicContributors();
      expect(prisma.contributorApplication.findMany.mock.calls[0][0].where.status).toBe('APPROVED');
    });
  });
});
