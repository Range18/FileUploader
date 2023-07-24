import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileSystemEntity } from './entities/fileSystemEntity';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { UserModule } from '@/user/user.module';
import { FsService } from '@/storage/fs.service';
import { PermissionsModule } from '@/permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileSystemEntity]),
    UserModule,
    PermissionsModule,
  ],
  controllers: [StorageController],
  providers: [StorageService, FsService],
  exports: [StorageService],
})
export class StorageModule {}