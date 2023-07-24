import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserPayload } from '@/user/interfaces/userPayload';
import { ApiException } from '../Exceptions/ApiException';
import { UserExceptions } from '../Exceptions/ExceptionTypes/UserExceptions';

@Injectable()
export class VerificationGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: UserPayload = request['user'];
    if (!user.isVerified) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'UserExceptions',
        UserExceptions.NotVerified,
      );
    }
    return true;
  }
}
