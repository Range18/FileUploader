import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { UserPayload } from '@/user/userPayload';
import { Request } from 'express';
import { map, Observable } from 'rxjs';

export class SetStorageIdInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const user: UserPayload = request['user'];
    request.query['storageId'] = request.query['storageId'] ?? user.UUID;

    return next.handle().pipe(map((request) => request));
  }
}
