import { SessionEntity } from './entities/sessions.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserPayload } from '@/user/userPayload';
import { LoggedUserRdo } from '@/user/rdo/logged-user.rdo';
import { jwtSettings } from '@/common/configs/config';
import { TokenService } from '@/token/token.service';
import { CreateSession } from '@/session/createSession';
import { BaseEntityService } from '@/common/base-entity.service';
import { GetSessionRdo } from '@/session/get-session.rdo';
import { BrowserInfo } from '@/session/browser-info';
import { Repository } from 'typeorm';

@Injectable()
export class SessionService extends BaseEntityService<
  SessionEntity,
  GetSessionRdo
> {
  constructor(
    private readonly tokenService: TokenService,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {
    super(sessionRepository, GetSessionRdo);
  }

  async saveSession(
    userData: CreateSession,
    sessionInfo: BrowserInfo,
  ): Promise<{ userRdo: LoggedUserRdo; refreshToken: string } | null> {
    const session = await this.sessionRepository.save({
      userUUID: userData.UUID,
      agent: sessionInfo.agent,
      ip: sessionInfo.ip,
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
