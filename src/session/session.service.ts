import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SessionEntity } from './entities/sessions.entity';
import { UserPayload } from '@/user/userPayload';
import { LoggedUserRdo } from '@/user/rdo/logged-user.rdo';
import { InjectRepository } from '@nestjs/typeorm';
import { jwtSettings } from '@/common/configs/config';
import { TokenService } from '@/token/token.service';
import { CreateSession } from '@/common/types/createSession';

@Injectable()
export class SessionService {
  constructor(
    private readonly tokenService: TokenService,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async saveSession(
    userData: CreateSession,
  ): Promise<{ userRdo: LoggedUserRdo; refreshToken: string } | null> {
    const session = await this.sessionRepository.save({
      userUUID: userData.UUID,
      expireAt: new Date(Date.now() + jwtSettings.refreshExpire.ms()),
    });
    const payload: UserPayload = {
      ...userData,
      sessionUUID: session.sessionUUID,
    };
    const accessToken = await this.tokenService.createToken(payload, {
      expiresIn: jwtSettings.accessExpire.value,
    });
    return {
      userRdo: {
        accessToken: accessToken,
        email: userData.email,
        username: userData.username,
      },
      refreshToken: await this.tokenService.createToken(payload, {
        expiresIn: jwtSettings.refreshExpire.value,
      }),
    };
  }

  async findOneByUUID(sessionUUID: string): Promise<SessionEntity> {
    return await this.sessionRepository.findOne({ where: { sessionUUID } });
  }

  async getUserFromToken(token: string): Promise<UserPayload | null> {
    return await this.tokenService.validateToken(token);
  }

  async removeSession(sessionUUID: string) {
    await this.sessionRepository.delete({ sessionUUID });
  }
}
