import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionEntity } from './entities/permissions.entity';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionEntity]), UserModule],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
