import { SessionEntity } from './entities/sessions.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserPayload } from '@/user/userPayload';
import { LoggedUserRdo } from '@/user/rdo/logged-user.rdo';
import { jwtSettings } from '@/common/configs/config';
import { TokenService } from '@/token/token.service';
import { CreateSession } from '@/common/types/createSession';
import { BaseEntityService } from '@/common/base-entity.service';
import { Repository } from 'typeorm';

@Injectable()
export class SessionService extends BaseEntityService<SessionEntity> {
  constructor(
    private readonly tokenService: TokenService,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {
    super(sessionRepository);
  }

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
}
