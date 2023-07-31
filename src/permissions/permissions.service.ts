import { HttpStatus, Injectable } from '@nestjs/common';
import { SetPermsDto } from './dto/set-perms.dto';
import { PermissionEntity } from './entities/permissions.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { GetPermsDto } from '@/permissions/dto/get-perms.dto';
import { UserService } from '@/user/user.service';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import { RolePerms } from '@/permissions/roles.constant';
import { OtherExceptions } from '@/common/Exceptions/ExceptionTypes/OtherExceptions';
import { FileExceptions } from '@/common/Exceptions/ExceptionTypes/FileExceptions';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionsRepository: Repository<PermissionEntity>,
    private readonly userService: UserService,
  ) {}

  async setPermission(setPermsDto: SetPermsDto): Promise<PermissionEntity> {
    const permissionEntity = await this.permissionsRepository.findOne({
      where: {
        userUUID: setPermsDto.userUUID,
        driveId: setPermsDto.driveUUID,
        name: setPermsDto.name,
      },
    });

    if (permissionEntity) {
      if (RolePerms[setPermsDto.role] > RolePerms[permissionEntity.role]) {
        permissionEntity.role = setPermsDto.role;
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
      role: setPermsDto.role,
      expireAt: setPermsDto.permsExpireAt,
    });
  }

  async getPermissions(getPermsDto: GetPermsDto): Promise<string[] | null> {
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
      await this.remove(permissionEntity);
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'OtherExceptions',
        OtherExceptions.PermissionExpired,
      );
    }
    return [permissionEntity.role];
  }

  async save(
    permissionEntities: PermissionEntity[],
  ): Promise<PermissionEntity[]> {
    return await this.permissionsRepository.save(permissionEntities);
  }

  async findOne(
    options: FindOneOptions<PermissionEntity>,
  ): Promise<PermissionEntity> {
    return await this.permissionsRepository.findOne(options);
  }

  async find(
    options: FindManyOptions<PermissionEntity>,
  ): Promise<PermissionEntity[]> {
    return await this.permissionsRepository.find(options);
  }

  async remove(permissionEntity: PermissionEntity) {
    await this.permissionsRepository.remove(permissionEntity);
  }

  async getAvailable(userUUID: string) {
    const user = await this.userService.findOne('UUID', userUUID);

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
        await this.remove(permissionEntity);
      }
    }

    return objectsAvailable;
  }
}
