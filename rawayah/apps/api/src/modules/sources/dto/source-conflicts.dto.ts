import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConflictConfidence, ConflictResolution, ContentType, SourceConflictType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSourceConflictDto {
  @ApiProperty({ enum: ContentType })
  @IsEnum(ContentType)
  contentType!: ContentType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contentId!: string;

  @ApiProperty({ example: 'نسبة البيت الثالث من المعلقة' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ enum: SourceConflictType })
  @IsEnum(SourceConflictType)
  conflictType!: SourceConflictType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sourceAId!: string;

  @ApiProperty({ example: 'ينسبه إلى امرئ القيس' })
  @IsString()
  @IsNotEmpty()
  sourceAClaim!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sourceBId!: string;

  @ApiProperty({ example: 'ينسبه إلى طرفة بن العبد' })
  @IsString()
  @IsNotEmpty()
  sourceBClaim!: string;

  @ApiPropertyOptional({ description: 'مصادر إضافية أو ملاحظات على الخلاف' })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class ResolveSourceConflictDto {
  @ApiProperty({ enum: ConflictResolution })
  @IsEnum(ConflictResolution)
  resolution!: ConflictResolution;

  @ApiProperty({ enum: ConflictConfidence })
  @IsEnum(ConflictConfidence)
  confidence!: ConflictConfidence;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewerNotes?: string;

  @ApiPropertyOptional({ description: 'النص المعروض للقارئ عند نشر المادة بوصفها مختلفًا فيها' })
  @IsOptional()
  @IsString()
  publicDisputeNote?: string;
}
