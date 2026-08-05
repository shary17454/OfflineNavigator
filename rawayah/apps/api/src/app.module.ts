import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { PermissionGuard } from './shared/common/roles.guard';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { ContentModule } from './modules/content/content.module';
import { SearchModule } from './modules/search/search.module';
import { MediaModule } from './modules/media/media.module';
import { ReadingListsModule } from './modules/reading-lists/reading-lists.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { GraphModule } from './modules/graph/graph.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    ContentModule,
    SearchModule,
    MediaModule,
    ReadingListsModule,
    PaymentsModule,
    GraphModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
