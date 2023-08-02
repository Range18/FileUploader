import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { UserPayload } from '@/user/userPayload';
import { Observable } from 'rxjs';

export class SetDefaultStorageQueryInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user: UserPayload = request.user;
    request.query['storageId'] = request.query['storageId']
      ? request.query['storageId']
      : user.UUID;
    request.query['path'] = request.query['path'] ? request.query['path'] : '/';
    request.query['isFolder'] = request.query['isFolder']
      ? Boolean(Number(request.query['isFolder']))
      : false;
    return next.handle().pipe();
  }
}
