import { VerificationService } from './verification.service';
import { VerificationCodeEntity } from './entities/verificationCode.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationCodeEntity])],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
