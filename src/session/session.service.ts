import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SessionEntity } from './entities/sessions.entity';
import { UserPayload } from '@/user/interfaces/userPayload';
import { UserDto } from '@/user/dto/userDto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserWithoutSession } from '@/user/interfaces/userWithoutSession';
import { jwtSettings } from '@/common/configs/config';
import { TokenService } from '@/token/token.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly tokenService: TokenService,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async saveSession(
    userData: UserWithoutSession,
  ): Promise<{ userDto: UserDto; refreshToken: string } | null> {
    const session = await this.sessionRepository.save({
      userUUID: userData.UUID,
      expireIn: new Date(
        Date.now() +
          Number(jwtSettings.refreshExpire.slice(0, -1)) * 24 * 60 * 60 * 1000,
      ),
    });
    const payload: UserPayload = {
      ...userData,
      sessionUUID: session.sessionUUID,
    };
    return {
      userDto: new UserDto(
        await this.tokenService.createToken(payload, {
          expiresIn: jwtSettings.accessExpire,
        }),
        payload,
      ),
      refreshToken: await this.tokenService.createToken(payload, {
        expiresIn: jwtSettings.refreshExpire,
      }),
    };
  }

  async findSessionByUUID(sessionUUID: string): Promise<SessionEntity> {
    return await this.sessionRepository.findOne({ where: { sessionUUID } });
  }

  async getUserFromToken(token: string): Promise<UserPayload | null> {
    return await this.tokenService.validateToken(token);
  }

  async removeSession(sessionUUID: string) {
    await this.sessionRepository.delete({ sessionUUID });
  }
}
