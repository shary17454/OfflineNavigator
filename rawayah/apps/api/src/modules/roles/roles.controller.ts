import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private svc: RolesService) {}

  @Post('seed')
  seed() {
    return this.svc.seed();
  }

  @Get()
  all() {
    return this.svc.all();
  }
}
