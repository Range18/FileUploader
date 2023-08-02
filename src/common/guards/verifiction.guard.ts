import { ApiException } from '../Exceptions/ApiException';
import { UserExceptions } from '../Exceptions/ExceptionTypes/UserExceptions';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { UserPayload } from '@/user/userPayload';
import { UserService } from '@/user/user.service';
import { UserEntity } from '@/user/entities/user.entity';

@Injectable()
export class VerificationGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userPayload: UserPayload = request['user'];
    const user: UserEntity = await this.userService.findByUUID(
      userPayload.UUID,
    );
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
