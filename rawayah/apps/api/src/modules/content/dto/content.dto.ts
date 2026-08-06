import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePoemDto {
  @ApiProperty({ example: 'qaseeda-ahl-al-malik' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: 'قصيدة العرب القديمة' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ example: 'نص القصيدة...' })
  @IsString()
  body!: string;

  @ApiProperty({ example: 'poet-id' })
  @IsString()
  poetId!: string;
}

export class CreatePoemVersionDto {
  @ApiProperty({ example: 'الرواية المتداولة' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiPropertyOptional({ example: 'رواية ديوان محقق طبعة 1998' })
  @IsOptional()
  @IsString()
  sourceNotes?: string;
}

export class CreatePoemVerseDto {
  @ApiProperty({ example: 'يا دار عبلة بالجواء تكلمي' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  orderIndex!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occasion?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @IsOptional()
  difficultyWords?: Record<string, string>;
}

export class CreatePoemVerseVariantDto {
  @ApiProperty({ example: 'نص البيت في رواية أخرى' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceNotes?: string;
}

export class CreatePoemAttributionDto {
  @ApiPropertyOptional({ example: 'poet-id' })
  @IsOptional()
  @IsString()
  poetId?: string;

  @ApiPropertyOptional({ example: 'اسم شاعر غير مسجل بعد' })
  @IsOptional()
  @IsString()
  claimedName?: string;

  @ApiPropertyOptional({ example: 'DISPUTED' })
  @IsOptional()
  @IsIn(['AGREED', 'DISPUTED'])
  consensus?: 'AGREED' | 'DISPUTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SearchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  era?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: 'relevance' | 'newest' | 'views';
}

export class CreateCommentDto {
  @ApiProperty({ example: 'POEM' })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({ example: 'poem-id' })
  @IsString()
  @IsNotEmpty()
  contentId!: string;

  @ApiProperty({ example: 'رائع جدًا هذا النص' })
  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class FavoriteDto {
  @ApiProperty({ example: 'POEM' })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({ example: 'poem-id' })
  @IsString()
  @IsNotEmpty()
  contentId!: string;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'مصدر هذه القصيدة؟' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'poetry' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: 'أحتاج تحققًا من البيت...' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class CreateAnswerDto {
  @ApiProperty({ example: 'هذا جواب توثيقي' })
  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class ReviewDto {
  @ApiProperty({ example: 'approve' })
  @IsString()
  @IsNotEmpty()
  action!: 'approve' | 'request_revision' | 'reject';

  @ApiPropertyOptional({ example: 'تم التحقق من المصادر' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class PublishDto {
  @ApiPropertyOptional({ example: 'محتوى موثق' })
  @IsOptional()
  @IsString()
  note?: string;
}
