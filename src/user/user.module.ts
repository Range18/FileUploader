import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { SessionModule } from '@/session/session.module';
import { MailModule } from '@/mail/mail.module';
import { VerificationModule } from '@/auth/verification/verification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    SessionModule,
    MailModule,
    VerificationModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
