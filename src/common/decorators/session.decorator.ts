import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserSession } from '@/session/user-session';

export const Session = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserSession => {
    const request = context.switchToHttp().getRequest();

    return request['session'] as UserSession;
  },
);
