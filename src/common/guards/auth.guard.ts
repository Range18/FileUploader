import { ApiException } from '../Exceptions/ApiException';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { TokenService } from '@/token/token.service';
import { TokenExceptions } from '@/common/Exceptions/ExceptionTypes/TokenExceptions';
import { UserPayload } from '@/user/userPayload';
import { SessionService } from '@/session/session.service';
import { SessionEntity } from '@/session/entities/sessions.entity';
import { SessionExceptions } from '@/common/Exceptions/ExceptionTypes/SessionExceptions';
import { Request } from 'express';

@Injectable()
export class AuthGuardClass implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  private extractAuthorizationToken(req: Request) {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' || 'Access-Token' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const accessToken = this.extractAuthorizationToken(request);

    if (!accessToken) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'TokenExceptions',
        TokenExceptions.InvalidAccessToken,
      );
    }

    const userPayload: UserPayload = await this.tokenService
      .validateToken<UserPayload>(accessToken)
      .catch((err) => {
        if (err.message === 'jwt expired') {
          throw new ApiException(
            HttpStatus.UNAUTHORIZED,
            'TokenExceptions',
            TokenExceptions.AccessTokenExpired,
          );
        }
        throw new ApiException(
          HttpStatus.UNAUTHORIZED,
          'TokenExceptions',
          TokenExceptions.InvalidAccessToken,
        );
      });

    const sessionEntity: SessionEntity = await this.sessionService.findOne({
      where: { sessionUUID: userPayload.sessionUUID },
    });

    if (!sessionEntity) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'SessionExceptions',
        SessionExceptions.SessionNotFound,
      );
    }

    request['user'] = { email: userPayload.email, UUID: userPayload.UUID };
    request['session'] = {
      UUID: sessionEntity.sessionUUID,
      expireAt: sessionEntity.expireAt,
    };
    return true;
  }
}
