import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { BrowserInfo } from '@/session/browser-info';
import { Request } from 'express';

export const UserMetadata = createParamDecorator(
  (data: unknown, context: ExecutionContext): BrowserInfo => {
    const req: Request = context.switchToHttp().getRequest<Request>();

    return { ip: req.ip, agent: req.get('user-agent') };
  },
);
