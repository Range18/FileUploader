import { ApiException } from '../Exceptions/ApiException';
import { FileExceptions } from '../Exceptions/ExceptionTypes/FileExceptions';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '@/permissions/permissions.service';
import { StorageService } from '@/storage/storage.service';

@Injectable()
export class RolesGuardClass implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionsService,
    private readonly storageService: StorageService,
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

      if (!user.roles) {
        const fileSystemEntity = await this.storageService.getFileSystemEntity({
          where: { name: name },
          loadRelationIds: { relations: ['owner'] },
        });

        if (!fileSystemEntity) {
          throw new ApiException(
            HttpStatus.NOT_FOUND,
            'FileExceptions',
            FileExceptions.FileNotFound,
          );
        }

        user.roles = fileSystemEntity.owner === user.UUID ? 'owner' : [];
      }

      const isAvailable = requiredRoles.some((role) =>
        user.roles?.includes(role),
      );

      if (!isAvailable) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          'FileExceptions',
          FileExceptions.AccessFail,
        );
      }

      return isAvailable;
    }
    //Behavior to other requests

    return true;
  }
}
