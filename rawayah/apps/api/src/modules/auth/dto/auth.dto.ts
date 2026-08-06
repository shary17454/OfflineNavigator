import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@rawaya.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'اسم المستخدم' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@rawaya.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class Verify2FADto {
  @ApiProperty()
  @IsString()
  pendingToken!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  code!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class DeleteAccountDto {
  @ApiProperty({ description: 'تأكيد كلمة المرور الحالية — إلزامي لأي عملية حذف حساب' })
  @IsString()
  @MinLength(8)
  password!: string;
}
