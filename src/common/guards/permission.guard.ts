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
import { PERMS_METADATA_KEY } from '@/common/constants';
import { Permissions } from '@/permissions/permissions.constant';

@Injectable()
export class PermissionGuardClass implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionsService,
    private readonly storageService: StorageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPerms: string[] = this.reflector.getAllAndOverride<string[]>(
      PERMS_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPerms) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    //Guard behavior if request is bounded with storage managing
    const controller = context.getClass().name;

    if (controller === 'StorageController') {
      const name: string = request.query['name'] as string;
      const storageId: string = request.query['storageId'] as string;

      //TODO methods with storageId

      if (!name && !storageId) {
        user.permissions = await this.permissionService.getPermsAsStr('owner');
        request['user'] = user;

        return true;
      }

      user.permissions = await this.permissionService.getPermissions({
        userUUID: user.UUID,
        name: name,
      });

      if (!user.permissions) {
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

        user.permissions =
          fileSystemEntity.owner === user.UUID
            ? await this.permissionService.getPermsAsStr('owner')
            : [];
      }

      const isAvailable = requiredPerms.some((perm) =>
        user.permissions?.includes(Permissions[perm]),
      );

      if (!isAvailable) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          'FileExceptions',
          FileExceptions.AccessFail,
        );
      }

      request['user'] = user;

      return isAvailable;
    }
    //Behavior to other requests

    return true;
  }
}
