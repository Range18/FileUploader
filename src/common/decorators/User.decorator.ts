import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '@/user/interfaces/userPayload';

export const User = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserPayload => {
    const req = context.switchToHttp().getRequest();
    return req.user;
  },
);
