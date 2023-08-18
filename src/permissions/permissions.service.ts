import { SetPermsDto } from './dto/set-perms.dto';
import { PermissionEntity } from './entities/permissions.entity';
import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GetPermsDto } from '@/permissions/dto/get-perms.dto';
import { UserService } from '@/user/user.service';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import { RolePerms, Roles } from '@/permissions/roles.constant';
import { OtherExceptions } from '@/common/Exceptions/ExceptionTypes/OtherExceptions';
import { FileExceptions } from '@/common/Exceptions/ExceptionTypes/FileExceptions';
import { BaseEntityService } from '@/common/base-entity.service';
import {
  Permissions,
  PermissionsAsStr,
} from '@/permissions/permissions.constant';
import { DefaultPermissionsEntity } from '@/permissions/entities/default-permissions.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionsService
  extends BaseEntityService<PermissionEntity>
  implements OnModuleInit
{
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionsRepository: Repository<PermissionEntity>,
    @InjectRepository(DefaultPermissionsEntity)
    private readonly defaultPermsRepository: Repository<DefaultPermissionsEntity>,
    private readonly userService: UserService,
  ) {
    super(permissionsRepository);
  }

  async onModuleInit() {
    for (const [perms, role] of Object.entries(RolePerms)) {
      if (typeof role === 'number') break;

      if (await this.defaultPermsRepository.findOne({ where: { name: role } }))
        continue;

      await this.defaultPermsRepository.save({
        name: <string>role,
        permissions: <number>(<unknown>perms),
      });
    }

    if (
      !(await this.defaultPermsRepository.findOne({
        where: { name: 'custom' },
      }))
    ) {
      await this.defaultPermsRepository.save({
        name: 'custom',
        permissions: null,
      });
    }
  }

  async setPermission(setPermsDto: SetPermsDto): Promise<PermissionEntity> {
    const permissionEntity = await this.permissionsRepository.findOne({
      where: {
        userUUID: setPermsDto.userUUID,
        driveId: setPermsDto.driveUUID,
        name: setPermsDto.name,
      },
    });

    if (permissionEntity) {
      if (setPermsDto.permissions > permissionEntity.permissions) {
        permissionEntity.permissions = setPermsDto.permissions;
      }

      if (permissionEntity.expireAt && !setPermsDto.permsExpireAt) {
        permissionEntity.expireAt = null;
      }

      return await this.permissionsRepository.save(permissionEntity);
    }

    return await this.permissionsRepository.save({
      userUUID: setPermsDto.userUUID,
      driveId: setPermsDto.driveUUID,
      name: setPermsDto.name,
      permissions: setPermsDto.permissions,
      expireAt: setPermsDto.permsExpireAt,
    });
  }

  async getPermissions(
    getPermsDto: GetPermsDto,
  ): Promise<PermissionsAsStr[] | null> {
    const permissionEntity = await this.permissionsRepository.findOne({
      where: {
        userUUID: getPermsDto.userUUID,
        name: getPermsDto.name,
      },
    });

    if (!permissionEntity) {
      return null;
    }

    if (permissionEntity.isTrashed) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.FileNotFound,
      );
    }

    if (
      permissionEntity.expireAt &&
      permissionEntity.expireAt < new Date(Date.now())
    ) {
      await this.removeOne(permissionEntity);
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'OtherExceptions',
        OtherExceptions.PermissionExpired,
      );
    }

    return this.getPermsAsStr(permissionEntity.permissions);
  }

  async getAvailable(userUUID: string) {
    const user = await this.userService.findByUUID(userUUID);

    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }

    const objectsAvailable = await this.permissionsRepository.find({
      where: { userUUID: userUUID },
    });

    for (const permissionEntity of objectsAvailable) {
      if (
        permissionEntity.isTrashed ||
        (permissionEntity.expireAt &&
          permissionEntity.expireAt < new Date(Date.now()))
      ) {
        const index = objectsAvailable.indexOf(permissionEntity);
        objectsAvailable.splice(index, 1);
      }

      if (
        permissionEntity.expireAt &&
        permissionEntity.expireAt < new Date(Date.now())
      ) {
        await this.removeOne(permissionEntity);
      }
    }

    return objectsAvailable;
  }

  async getPermsAsStr(perms: Roles): Promise<PermissionsAsStr[]>;
  async getPermsAsStr(perms: number): Promise<PermissionsAsStr[]>;
  async getPermsAsStr(
    permsOrRole: number | Roles,
  ): Promise<PermissionsAsStr[]> {
    const permissions: PermissionsAsStr[] = [];

    const perms: number =
      typeof permsOrRole === 'number'
        ? permsOrRole
        : (
            await this.defaultPermsRepository.findOne({
              where: { name: permsOrRole },
            })
          ).permissions;

    for (const permission of Object.values(Permissions)) {
      const IsHasPerm = perms & Permissions[permission];

      if (IsHasPerm) {
        permissions.push(<PermissionsAsStr>permission);
      }
    }

    return permissions;
  }

  getPermsAsNumber(perms: PermissionsAsStr[]): number {
    return perms.reduce((sum, perm) => sum + Permissions[perm], 0);
  }
}
