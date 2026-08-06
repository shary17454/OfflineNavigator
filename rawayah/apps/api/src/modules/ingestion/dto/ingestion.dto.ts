import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateIngestionSourceDto {
  @ApiProperty({ example: 'المكتبة الوطنية' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiProperty({ example: 'مكتبة وطنية' })
  @IsString()
  @IsNotEmpty()
  sourceType!: string;

  @ApiPropertyOptional({ example: 2, description: '1 (وثيقة أصلية) إلى 5 (مجهول المصدر)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  tier?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allowedUseNote?: string;
}

export class CreateIngestionJobDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiProperty({ example: 'MANUAL_JSON' })
  @IsIn(['MANUAL_CSV', 'MANUAL_JSON', 'MANUAL_ENTRY'])
  method!: 'MANUAL_CSV' | 'MANUAL_JSON' | 'MANUAL_ENTRY';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StageRecordDto {
  @ApiProperty({ example: 'POEM' })
  @IsString()
  @IsNotEmpty()
  targetContentType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalRef?: string;

  @ApiProperty({ description: 'الحقول الخام كما وردت من ملف المصدر' })
  @IsObject()
  rawData!: Record<string, unknown>;
}

export class StageRecordsDto {
  @ApiProperty({ type: [StageRecordDto] })
  @IsArray()
  records!: StageRecordDto[];
}

export class ResolveDuplicateDto {
  @ApiProperty({ example: 'NOT_DUPLICATE' })
  @IsIn(['CONFIRMED_DUPLICATE', 'NOT_DUPLICATE', 'MERGED'])
  status!: 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE' | 'MERGED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mergeNote?: string;
}

export class RejectRecordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class PublishBatchDto {
  @ApiProperty({ example: 'دفعة قصائد تجريبية - مصدر كذا' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  recordIds!: string[];
}
