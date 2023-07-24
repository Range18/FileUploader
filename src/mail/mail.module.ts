import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { UserModule } from '@/user/user.module';
import { PassResetModule } from '@/user/passReset/passReset.module';
import { MailController } from './mail.controller';

@Module({
  imports: [UserModule, PassResetModule],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
