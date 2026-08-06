import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertSettingDto {
  @ApiProperty({ example: 'site.maintenance_mode' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  // القيمة قد تكون أي نوع JSON صالح (نص/رقم/منطقي/كائن) — لا يوجد مُدقِّق
  // نوع محدد، لكن IsDefined إلزامي هنا: ValidationPipe يعمل بخيار whitelist
  // العام، فيحذف أي حقل بلا مُزخرِف class-validator واحد على الأقل حتى لو
  // أُرسل فعليًا من العميل.
  @ApiProperty({ example: false })
  @IsDefined()
  value: unknown;

  @ApiPropertyOptional({ example: 'global' })
  @IsOptional()
  @IsString()
  scope?: string;
}
