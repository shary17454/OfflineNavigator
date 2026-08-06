import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSuggestionDto {
  @ApiProperty({ example: 'CORRECTION' })
  @IsIn(['CORRECTION', 'NEW_SOURCE', 'NEW_CONTENT'])
  suggestionType!: 'CORRECTION' | 'NEW_SOURCE' | 'NEW_CONTENT';

  @ApiPropertyOptional({ example: 'POEM' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ example: 'poem-id' })
  @IsOptional()
  @IsString()
  contentId?: string;

  @ApiProperty({ example: 'خطأ في نسبة القصيدة' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'القصيدة منسوبة لشاعر آخر بحسب مصدر كذا' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ example: 'source-id' })
  @IsOptional()
  @IsString()
  proposedSourceId?: string;
}

export class ReviewSuggestionDto {
  @ApiProperty({ example: 'ACCEPTED' })
  @IsIn(['ACCEPTED', 'REJECTED'])
  status!: 'ACCEPTED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
