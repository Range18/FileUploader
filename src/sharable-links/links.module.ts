import { Module } from '@nestjs/common';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkEntity } from './entities/link.entity';
import { UserModule } from '@/user/user.module';
import { StorageModule } from '@/storage/storage.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { SessionModule } from '@/session/session.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LinkEntity]),
    UserModule,
    StorageModule,
    PermissionsModule,
    SessionModule,
  ],
  controllers: [LinksController],
  providers: [LinksService],
})
export class LinksModule {}
