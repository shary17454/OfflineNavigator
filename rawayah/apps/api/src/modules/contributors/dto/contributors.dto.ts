import { Equals, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class SubmitContributorApplicationDto {
  @IsEnum(['NARRATOR', 'HISTORIAN'] as unknown as object)
  type!: 'NARRATOR' | 'HISTORIAN';

  // ---- بيانات عامة (تُعرض بعد القبول) ----
  @IsString()
  @MinLength(2)
  publicDisplayName!: string;

  @IsString()
  @MinLength(20)
  publicBio!: string;

  @IsString()
  @MinLength(2)
  publicSpecialties!: string;

  @IsOptional()
  @IsString()
  publicAvatarUrl?: string;

  @IsOptional()
  @IsString()
  publicCountry?: string;

  @IsOptional()
  @IsString()
  publicRegion?: string;

  // ---- بيانات خاصة للتحقق (لا تُعرض للعامة إطلاقًا) ----
  @IsString()
  @MinLength(4)
  privateFullName!: string;

  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  privateEmail!: string;

  @IsOptional()
  @IsString()
  privatePhoneNumber?: string;

  @IsOptional()
  @IsString()
  privatePreferredContact?: string;

  @IsString()
  @MinLength(10)
  privateExperience!: string;

  @IsOptional()
  @IsString()
  privateKnowledgeSources?: string;

  @IsOptional()
  @IsBoolean()
  privateReliesOnOralTradition?: boolean;

  @IsOptional()
  @IsBoolean()
  privateHasRecordings?: boolean;

  @IsOptional()
  @IsBoolean()
  privateHasDocuments?: boolean;

  @IsOptional()
  @IsString()
  privateCredentials?: string;

  @IsOptional()
  @IsString()
  privatePublications?: string;

  @IsOptional()
  @IsString()
  privateProfessionalLinks?: string;

  @IsOptional()
  @IsString()
  privateSampleWorkUrl?: string;

  // ---- الموافقات الصريحة ----
  // Equals(true) يرفض الطلب على مستوى الخادم إذا لم تكن الموافقة صريحة،
  // فلا يكفي إخفاء الزر في الواجهة.
  @IsBoolean()
  @Equals(true, { message: 'يجب الموافقة صراحةً على ظهور بيانات ملفك العام' })
  publicDisplayConsent!: boolean;

  @IsBoolean()
  @Equals(true, { message: 'يجب قبول اتفاقية المساهم قبل التقديم' })
  contributorAgreementAccepted!: boolean;
}

export class ReviewContributorApplicationDto {
  @IsEnum(['APPROVED', 'REJECTED', 'NEEDS_INFORMATION', 'UNDER_REVIEW', 'SUSPENDED', 'REVOKED'] as unknown as object)
  decision!: 'APPROVED' | 'REJECTED' | 'NEEDS_INFORMATION' | 'UNDER_REVIEW' | 'SUSPENDED' | 'REVOKED';

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsString()
  infoRequestedNote?: string;
}

export class WithdrawConsentDto {
  @IsEnum([
    'NARRATOR_PUBLIC_PROFILE',
    'HISTORIAN_PUBLIC_PROFILE',
    'CONTRIBUTOR_AGREEMENT',
    'POLICY_ACCEPTANCE',
  ] as unknown as object)
  consentType!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
