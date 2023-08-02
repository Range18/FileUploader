import { VerificationCodeEntity } from './entities/verificationCode.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationCodeEntity)
    private verificationRepository: Repository<VerificationCodeEntity>,
  ) {}

  async createCode(userUUID: string): Promise<VerificationCodeEntity> {
    return await this.verificationRepository.save({ userUUID });
  }

  async findByCode(code: string): Promise<VerificationCodeEntity | null> {
    return await this.verificationRepository.findOne({ where: { code } });
  }

  async deleteCode(code: string) {
    await this.verificationRepository.delete({ code });
  }
}
