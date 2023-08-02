import { PassResetService } from './passReset.service';
import { PwdResetCodeEntity } from './entities/pwdResetCode.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
