import { Module } from '@nestjs/common';
import { PassResetService } from './passReset.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PwdResetCodeEntity } from './entities/pwdResetCode.entity';
import { UserModule } from '@/user/user.module';
import { PassResetController } from '@/user/passReset/PassReset.controller';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PwdResetCodeEntity]),
    UserModule,
    MailModule,
  ],
  providers: [PassResetService],
  controllers: [PassResetController],
  exports: [PassResetService],
})
export class PassResetModule {}
