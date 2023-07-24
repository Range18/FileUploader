import { Module } from '@nestjs/common';
import { PassResetService } from './passReset.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PwdResetCodeEntity } from './entities/pwdResetCode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PwdResetCodeEntity])],
  providers: [PassResetService],
  exports: [PassResetService],
})
export class PassResetModule {}
