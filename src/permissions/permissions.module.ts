import { PermissionsService } from './permissions.service';
import { PermissionEntity } from './entities/permissions.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionEntity]), UserModule],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
