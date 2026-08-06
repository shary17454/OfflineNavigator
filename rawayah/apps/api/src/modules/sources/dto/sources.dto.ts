import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSourceDto {
  @ApiProperty({ example: 'ديوان امرئ القيس، تحقيق محمد أبو الفضل إبراهيم' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  editor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  edition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  publicationYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty({ example: 'ديوان محقق' })
  @IsString()
  @IsNotEmpty()
  sourceType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  // تقييم جودة المصدر: 1 (وثيقة/مخطوطة أصلية) إلى 5 (منتدى/مجهول المصدر).
  @ApiPropertyOptional({ example: 2, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  tier?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tierReason?: string;
}

export class UpdateSourceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  editor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  edition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  publicationYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  tier?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tierReason?: string;
}
