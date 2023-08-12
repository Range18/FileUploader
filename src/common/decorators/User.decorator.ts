import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { InterceptedUserData } from '@/user/intercepted-userData';
import { Roles } from '@/permissions/roles.constant';
import { Request } from 'express';
import { UserPayload } from '@/user/userPayload';

export const User = createParamDecorator(
  (
    data: keyof InterceptedUserData = undefined,
    context: ExecutionContext,
  ): Roles[] | string | InterceptedUserData | UserPayload => {
    const req: Request = context.switchToHttp().getRequest<Request>();

    return data ? (req['user'] as InterceptedUserData)[data] : req['user'];
  },
);
