import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, RefreshDto, RegisterDto, Verify2FADto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private svc: AuthService) {}

  @ApiBody({ type: RegisterDto })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.svc.register(dto);
  }

  @ApiBody({ type: LoginDto })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.svc.login(dto);
  }

  @ApiBody({ type: RefreshDto })
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.svc.refresh(dto);
  }

  @Post('logout')
  logout(@Body('refreshToken') refreshToken: string) {
    return this.svc.logout(refreshToken);
  }

  @ApiBody({ type: Verify2FADto })
  @Post('2fa/verify')
  verify2FA(@Body() dto: Verify2FADto) {
    return this.svc.verify2FA(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.svc.changePassword(user.id, dto);
  }
}
