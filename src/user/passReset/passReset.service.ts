import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PwdResetCodeEntity } from './entities/pwdResetCode.entity';
import { Repository } from 'typeorm';

import { bcryptRounds, pwdResetExpire } from '@/common/configs/config';
import { UserService } from '@/user/user.service';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import { TokenExceptions } from '@/common/Exceptions/ExceptionTypes/TokenExceptions';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PassResetService {
  constructor(
    @InjectRepository(PwdResetCodeEntity)
    private readonly passResetCodeRep: Repository<PwdResetCodeEntity>,
    private readonly userService: UserService,
  ) {}

  async createPassResetCode(email: string): Promise<PwdResetCodeEntity> {
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }

    return this.passResetCodeRep.save({
      userUUID: user.UUID,
      expireIn: new Date(Date.now() + pwdResetExpire.ms()),
    });
  }

  async resetPassword(code: string, newPassword: string) {
    const passResetRecord = await this.findPassResetCode(code);
    if (!passResetRecord) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'TokenExceptions',
        TokenExceptions.InvalidToken,
      );
    }
    if (passResetRecord.expireIn < new Date(Date.now())) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'TokenExceptions',
        TokenExceptions.TokenExpired,
      );
    }
    const user = await this.userService.findByUUID(passResetRecord.userUUID);
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }

    user.password = await bcrypt.hash(newPassword, bcryptRounds);
    await this.userService.saveUser(user);

    await this.deletePassResetCode(code);
  }

  async findPassResetCode(code: string): Promise<PwdResetCodeEntity | null> {
    return this.passResetCodeRep.findOne({ where: { code } });
  }

  async deletePassResetCode(code: string) {
    return this.passResetCodeRep.delete({ code });
  }
}
