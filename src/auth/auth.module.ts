import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@/user/user.module';
import { SessionModule } from '@/session/session.module';
import { MailModule } from '@/mail/mail.module';
import { VerificationModule } from './verification/verification.module';
import { StorageModule } from '@/storage/storage.module';

@Module({
  imports: [
    UserModule,
    SessionModule,
    MailModule,
    VerificationModule,
    StorageModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
