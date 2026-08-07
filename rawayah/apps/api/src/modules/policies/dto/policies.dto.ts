import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export const POLICY_CODES = [
  'TERMS_OF_SERVICE',
  'PRIVACY_POLICY',
  'CONTENT_POLICY',
  'CONTRIBUTOR_AGREEMENT',
  'COPYRIGHT_POLICY',
  'TAKEDOWN_POLICY',
  'SOURCE_POLICY',
  'ORAL_HISTORY_POLICY',
  'COMMUNITY_GUIDELINES',
] as const;

// تحرير سياسة = إنشاء إصدار جديد، لا كتابة فوق النص السابق.
export class PublishPolicyVersionDto {
  @IsEnum(POLICY_CODES as unknown as object)
  code!: (typeof POLICY_CODES)[number];

  @IsString()
  @MinLength(1)
  version!: string;

  @IsString()
  @MinLength(2)
  titleAr!: string;

  @IsString()
  @MinLength(20)
  bodyAr!: string;

  @IsOptional()
  @IsBoolean()
  requiresReacceptance?: boolean;
}

export class AcceptPolicyDto {
  @IsString()
  documentId!: string;
}
