import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '@/user/userPayload';
import { Request } from 'express';

export const User = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserPayload => {
    const req: Request = context.switchToHttp().getRequest<Request>();
    return req['user'];
  },
);
