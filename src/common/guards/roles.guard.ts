import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiException } from '../Exceptions/ApiException';
import { FileExceptions } from '../Exceptions/ExceptionTypes/FileExceptions';
import { PermissionsService } from '@/permissions/permissions.service';

@Injectable()
export class RolesGuardClass implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles: string[] = this.reflector.getAllAndOverride<string[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    //Guard behavior if request is bounded with storage managing
    const controller = context.getClass().name;

    if (controller == 'StorageController') {
      const name: string = request.query['name'] as string;
      if (!name) {
        return true;
      }

      user.roles = await this.permissionService.getPermissions({
        userUUID: user.UUID,
        name: name,
      });

      const isAvailable = requiredRoles.some((role) =>
        user.roles?.includes(role),
      );

      if (!isAvailable) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          'FileExceptions',
          FileExceptions.ObjectAccessFail,
        );
      }

      return isAvailable;
    }
    //Behavior to other requests

    return true;
  }
}
