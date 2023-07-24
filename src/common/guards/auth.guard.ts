import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiException } from '../Exceptions/ApiException';
import { TokenService } from '@/token/token.service';
import { TokenExceptions } from '@/common/Exceptions/ExceptionTypes/TokenExceptions';
import { UserPayload } from '@/user/interfaces/userPayload';

@Injectable()
export class AuthGuardClass implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  private extractAuthorizationToken(req: Request) {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' || 'Access-Token' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const accessToken = this.extractAuthorizationToken(request);
    if (!accessToken) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'TokenExceptions',
        TokenExceptions.InvalidAccessToken,
      );
    }

    const user: UserPayload = await this.tokenService
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
    if (!user) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'TokenExceptions',
        TokenExceptions.InvalidAccessToken,
      );
    }
    request['user'] = user;
    return true;
  }
}
