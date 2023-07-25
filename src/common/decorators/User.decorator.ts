import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '@/user/userPayload';

export const User = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserPayload => {
    const req = context.switchToHttp().getRequest();
    return req.user;
  },
);
