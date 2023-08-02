import { AuthModule } from './auth/auth.module';
import { typeOrmConfig } from './common/configs/TypeOrmConfig';
import { StorageModule } from './storage/storage.module';
import { LinksModule } from './sharable-links/links.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UserModule } from '@/user/user.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { PassResetModule } from '@/user/passReset/passReset.module';
import { SessionModule } from '@/session/session.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UserModule,
    StorageModule,
    LinksModule,
    PermissionsModule,
    SessionModule,
    PassResetModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
