import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ModerationReviewDto {
  @ApiProperty({ example: 'approve' })
  @IsIn(['approve', 'request_revision', 'reject'])
  action!: 'approve' | 'request_revision' | 'reject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ModerationPublishDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ModerationHideDto {
  @ApiProperty({ example: 'شكوى حقوق نشر' })
  @IsString()
  reason!: string;
}
