import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PwdResetCodeEntity } from './entities/pwdResetCode.entity';
import { Repository } from 'typeorm';

import { pwdResetExpire } from '@/common/configs/config';

@Injectable()
export class PassResetService {
  constructor(
    @InjectRepository(PwdResetCodeEntity)
    private readonly passResetCodeRep: Repository<PwdResetCodeEntity>,
  ) {}

  async createPassResetCode(userUUID: string): Promise<PwdResetCodeEntity> {
    return this.passResetCodeRep.save({
      userUUID: userUUID,
      expireIn: new Date(Date.now() + pwdResetExpire.ms()),
    });
  }

  async findPassResetCode(code: string): Promise<PwdResetCodeEntity | null> {
    return this.passResetCodeRep.findOne({ where: { code } });
  }

  async deletePassResetCode(code: string) {
    return this.passResetCodeRep.delete({ code });
  }
}
