import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationCodeEntity } from './entities/verificationCode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationCodeEntity])],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
