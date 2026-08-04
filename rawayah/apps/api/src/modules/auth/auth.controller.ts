import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';

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
}
