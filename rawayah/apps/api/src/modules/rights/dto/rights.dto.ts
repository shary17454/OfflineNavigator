import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

const RIGHTS_STATUSES = [
  'UNKNOWN',
  'UNDER_REVIEW',
  'PUBLIC_DOMAIN',
  'LICENSED',
  'PERMISSION_GRANTED',
  'RESTRICTED',
  'EXPIRED',
  'TAKEDOWN_REQUESTED',
] as const;

export class UpsertRightsDto {
  @ApiProperty({ example: 'PUBLIC_DOMAIN', enum: RIGHTS_STATUSES })
  @IsIn(RIGHTS_STATUSES)
  status!: (typeof RIGHTS_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  permissionDocUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grantedByName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  grantedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
