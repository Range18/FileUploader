import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SessionInfo } from '@/session/session-info';
import { Request } from 'express';

export const ReqMetadata = createParamDecorator(
  (data: unknown, context: ExecutionContext): SessionInfo => {
    const req: Request = context.switchToHttp().getRequest<Request>();

    return { ip: req.ip, agent: req.get('user-agent') };
  },
);
