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
import {
  Permissions,
  PermissionsAsStr,
} from '@/permissions/permissions.constant';
import { MoveFileDto } from '@/storage/dto/moveFile.dto';
import { FileSystemEntity } from '@/storage/entities/fileSystemEntity';
import { RootDirWithDriveId } from '@/storage/types/rootDir.type';
import { ROOT_NAME, ROOT_PATH } from '@/storage/storage.constants';
import { join, normalize } from 'path';

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
      const name: string = request.query['name'] ?? request.body['name'];
      const path: string = request.query['path'] ?? request.body['path'];
      const storageId: string = request.params['id'] ?? user.UUID;
      const method = context.getHandler().name;

      switch (method) {
        case 'uploadFile':
        case 'getDirContent':
          const destination = join(storageId, path);
          if (path === '/') {
            user.permissions =
              storageId === user.UUID
                ? await this.permissionService.getPermsAsStr('owner')
                : [];

            break;
          }

          const fileSystemEntity = await this.storageService.findOne({
            where: { destination },
            loadRelationIds: { relations: ['owner'] },
          });

          if (!fileSystemEntity) {
            throw new ApiException(
              HttpStatus.NOT_FOUND,
              'FileExceptions',
              FileExceptions.FileNotFound,
            );
          }

          user.permissions = await this.permissionService.getPermissions({
            userUUID: user.UUID,
            name: fileSystemEntity.name,
          });
          break;

        case 'mkDir':
          const whereToCreate = request.body['whereToCreate'];

          if (
            whereToCreate === ROOT_PATH ||
            whereToCreate === ROOT_NAME ||
            whereToCreate === user.UUID
          ) {
            user.permissions =
              storageId === user.UUID
                ? await this.permissionService.getPermsAsStr('owner')
                : [];

            break;
          }

          const createAtEntity = await this.storageService.findOne({
            where: { name: whereToCreate },
            loadRelationIds: { relations: ['owner'] },
          });

          if (!createAtEntity) {
            throw new ApiException(
              HttpStatus.NOT_FOUND,
              'FileExceptions',
              FileExceptions.FileNotFound,
            );
          }

          user.permissions = await this.permissionService.getPermissions({
            userUUID: user.UUID,
            name: whereToCreate,
          });

          break;

        case 'moveFile':
          const moveFileDto: MoveFileDto = request.body;

          const newDestEntity: FileSystemEntity | RootDirWithDriveId =
            moveFileDto.dirname === 'root' || moveFileDto.dirname === '/'
              ? {
                  owner: storageId,
                  name: 'root',
                  destination: `${storageId}/`,
                  isTrashed: false,
                }
              : await this.storageService.findOne({
                  where: {
                    name: moveFileDto.dirname,
                    type: 'folder',
                  },
                  loadRelationIds: { relations: ['owner'] },
                });

          if (!newDestEntity) {
            throw new ApiException(
              HttpStatus.NOT_FOUND,
              'FileExceptions',
              FileExceptions.FileNotFound,
            );
          }

          const newDestPerms: PermissionsAsStr[] =
            (await this.permissionService.getPermissions({
              userUUID: user.UUID,
              name: newDestEntity.name,
            })) ?? user.UUID === newDestEntity.owner
              ? await this.permissionService.getPermsAsStr('owner')
              : [];

          let entityPerms: PermissionsAsStr[] =
            await this.permissionService.getPermissions({
              userUUID: user.UUID,
              name: moveFileDto.filename,
            });

          if (!entityPerms) {
            const fileEntity = await this.storageService.findOne({
              where: { name: moveFileDto.filename },
              loadRelationIds: { relations: ['owner'] },
            });

            if (!fileEntity) {
              throw new ApiException(
                HttpStatus.NOT_FOUND,
                'FileExceptions',
                FileExceptions.FileNotFound,
              );
            }

            entityPerms =
              fileEntity.owner === user.UUID
                ? await this.permissionService.getPermsAsStr('owner')
                : [];
          }

          user.permissions = entityPerms.concat(
            newDestPerms.filter((perm) => entityPerms.indexOf(perm) < 0),
          );

          break;

        default:
          user.permissions = await this.permissionService.getPermissions({
            userUUID: user.UUID,
            name: name,
          });
          break;
      }

      //TODO methods with storageId and disable to access root (/) ^^^^

      if (!user.permissions) {
        const fileSystemEntity =
          (await this.storageService.findOne({
            where: { name: name },
            loadRelationIds: { relations: ['owner'] },
          })) ??
          (await this.storageService.findOne({
            where: {
              destination: normalize(join(storageId, request.body['path'])),
            },
            loadRelationIds: { relations: ['owner'] },
          }));

        if (!fileSystemEntity) {
          throw new ApiException(
            HttpStatus.NOT_FOUND,
            'FileExceptions',
            FileExceptions.FileNotFound,
          );
        }

        console.log(fileSystemEntity);

        user.permissions =
          fileSystemEntity.owner === user.UUID
            ? await this.permissionService.getPermsAsStr('owner')
            : await this.permissionService.getPermissions({
                userUUID: user.UUID,
                name: fileSystemEntity.name,
              });
      }

      const isAvailable = requiredPerms.every((perm) =>
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
