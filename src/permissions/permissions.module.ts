import { PermissionsService } from './permissions.service';
import { PermissionEntity } from './entities/permissions.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@/user/user.module';
import { PermissionsController } from '@/permissions/permissions.controller';
import { DefaultPermissionsEntity } from '@/permissions/entities/default-permissions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PermissionEntity, DefaultPermissionsEntity]),
    UserModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
