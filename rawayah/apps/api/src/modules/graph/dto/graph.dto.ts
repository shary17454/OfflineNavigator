import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRelationDto {
  @ApiProperty({ example: 'POEM' })
  @IsString()
  @IsNotEmpty()
  sourceType!: string;

  @ApiProperty({ example: 'poem-id' })
  @IsString()
  @IsNotEmpty()
  sourceId!: string;

  @ApiProperty({ example: 'POET' })
  @IsString()
  @IsNotEmpty()
  targetType!: string;

  @ApiProperty({ example: 'poet-id' })
  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @ApiProperty({ example: 'شاعر' })
  @IsString()
  @IsNotEmpty()
  relationType!: string;

  @ApiPropertyOptional({ example: 'شاعر القصيدة' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpsertTrustAssessmentDto {
  @ApiProperty({ example: 80 })
  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @ApiProperty({ example: 'مصدران مستقلان متفقان ونسخة مخطوطة تدعم النص' })
  @IsString()
  @IsNotEmpty()
  reasoning!: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sourceCount?: number;

  @ApiPropertyOptional({ example: 'مصدران محكّمان' })
  @IsOptional()
  @IsString()
  sourceStrength?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasConflictingSources?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOralNarration?: boolean;

  @ApiPropertyOptional({ example: 'AGREED' })
  @IsOptional()
  @IsIn(['AGREED', 'DISPUTED'])
  consensusStatus?: 'AGREED' | 'DISPUTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewedByName?: string;
}
