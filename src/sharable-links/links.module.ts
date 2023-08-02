import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { LinkEntity } from './entities/link.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserModule } from '@/user/user.module';
import { StorageModule } from '@/storage/storage.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { SessionModule } from '@/session/session.module';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LinkEntity]),
    UserModule,
    StorageModule,
    PermissionsModule,
    SessionModule,
    MailModule,
  ],
  controllers: [LinksController],
  providers: [LinksService],
})
export class LinksModule {}
