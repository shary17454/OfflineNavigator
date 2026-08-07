import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const TAXONOMY_DIMENSIONS = [
  'TRADITION',
  'ERA',
  'THEME',
  'REGION',
  'PERFORMANCE',
  'COLLECTION',
] as const;

export const POET_FILE_ITEM_KINDS = [
  'TEXT',
  'AUDIO',
  'VIDEO',
  'IMAGE',
  'DOCUMENT',
  'EXTERNAL_LINK',
] as const;

export class CreateTaxonomyTermDto {
  @IsString()
  @MinLength(2)
  slug!: string;

  @IsString()
  @MinLength(2)
  nameAr!: string;

  @IsEnum(TAXONOMY_DIMENSIONS as unknown as object)
  dimension!: (typeof TAXONOMY_DIMENSIONS)[number];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateTaxonomyTermDto {
  @IsOptional()
  @IsString()
  nameAr?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MergeTaxonomyTermDto {
  @IsString()
  targetTermId!: string;
}

export class ReorderTaxonomyDto {
  // قائمة معرّفات مرتبة — الترتيب في المصفوفة هو الترتيب المطلوب.
  @IsArray()
  @IsString({ each: true })
  orderedIds!: string[];
}

export class SetPoemTaxonomyDto {
  @IsArray()
  @IsString({ each: true })
  termIds!: string[];
}

export class UpsertPoetFileDto {
  @IsOptional()
  @IsString()
  overview?: string;
}

export class CreatePoetFileItemDto {
  @IsEnum(POET_FILE_ITEM_KINDS as unknown as object)
  kind!: (typeof POET_FILE_ITEM_KINDS)[number];

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  bodyText?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  externalUrl?: string;

  @IsOptional()
  @IsString()
  poemId?: string;

  @IsOptional()
  @IsString()
  occasion?: string;

  @IsOptional()
  @IsString()
  materialDate?: string;

  @IsOptional()
  @IsString()
  reciterName?: string;

  @IsOptional()
  @IsString()
  capturedByName?: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  sourceNotes?: string;

  @IsOptional()
  @IsString()
  rightsHolder?: string;

  @IsOptional()
  @IsString()
  licenseName?: string;
}

export class ReviewPoetFileItemDto {
  @IsEnum(['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'] as unknown as object)
  decision!: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

// حقول الحقوق لا يملك تعديلها إلا المالك — لذلك DTO منفصل
// لا يُقبل ضمن مسار الإضافة الخاص بالرواة والمؤرخين.
export class SetPoetFileItemRightsDto {
  @IsEnum([
    'UNKNOWN',
    'UNDER_REVIEW',
    'PUBLIC_DOMAIN',
    'LICENSED',
    'PERMISSION_GRANTED',
    'RESTRICTED',
    'EXPIRED',
    'TAKEDOWN_REQUESTED',
  ] as unknown as object)
  rightsStatus!: string;

  @IsOptional()
  @IsString()
  rightsHolder?: string;

  @IsOptional()
  @IsString()
  licenseName?: string;

  @IsOptional()
  @IsBoolean()
  allowDisplay?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;

  @IsOptional()
  @IsBoolean()
  allowCommercial?: boolean;
}
