import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserController } from './user.controller';
import { PwdResetCodeEntity } from './passReset/entities/pwdResetCode.entity';
import { PassResetModule } from './passReset/passReset.module';
import { SessionModule } from '@/session/session.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PwdResetCodeEntity]),
    PassResetModule,
    SessionModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
