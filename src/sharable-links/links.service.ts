import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LinkEntity } from './entities/link.entity';
import { Repository } from 'typeorm';
import { ApiException } from '@/common/Exceptions/ApiException';
import { TokenExceptions } from '@/common/Exceptions/ExceptionTypes/TokenExceptions';
import { PermissionsService } from '@/permissions/permissions.service';
import { UserPayload } from '@/user/interfaces/userPayload';
import { FileExceptions } from '@/common/Exceptions/ExceptionTypes/FileExceptions';
import { StorageService } from '@/storage/storage.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { getTimeMultByChar } from '@/common/utils/getTimeMultByChar';
import { extname } from 'path';

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(LinkEntity)
    private readonly linkRepository: Repository<LinkEntity>,
    private readonly storageService: StorageService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async createLink(userUUID: string, createLinkDto: CreateLinkDto) {
    const fsEntity = await this.storageService.getFileSystemEntity({
      where: { name: createLinkDto.name },
    });

    if (!fsEntity) {
      if (extname(createLinkDto.name)) {
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          'FileExceptions',
          FileExceptions.FileNotFound,
        );
      }

      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.DirNotFound,
      );
    }

    return await this.linkRepository.save({
      userShared: userUUID,
      destination: fsEntity.destination,
      name: fsEntity.name,
      setRoles: createLinkDto.roles,
      isPrivate: createLinkDto.isPrivate,
      usesLimit: createLinkDto.usesLimit,
      permsExpireAt: createLinkDto.permsExpireIn
        ? new Date(
            Date.now() +
              Number(createLinkDto.permsExpireIn.slice(0, -1)) *
                getTimeMultByChar(createLinkDto.permsExpireIn.slice(-1)),
          )
        : createLinkDto.permsExpireIn,
      expireAt: createLinkDto.expireIn
        ? new Date(
            Date.now() +
              Number(createLinkDto.expireIn.slice(0, -1)) *
                getTimeMultByChar(createLinkDto.expireIn.slice(-1)),
          )
        : createLinkDto.expireIn,
    });
  }

  async getLinkEntityByUUID(uuid: string): Promise<LinkEntity> {
    return await this.linkRepository.findOne({ where: { link: uuid } });
  }

  async updateLink(uuid: string, user: UserPayload) {
    const linkEntity = await this.linkRepository.findOne({
      where: { link: uuid },
    });
    if (!linkEntity) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'TokenExceptions',
        TokenExceptions.TokenNotFound,
      );
    }
    linkEntity.lastPass = new Date(Date.now());

    const fsEntity = await this.storageService.getFileSystemEntity({
      where: { name: linkEntity.name },
    });
    if (!fsEntity || fsEntity.isTrashed) {
      await this.linkRepository.remove(linkEntity);
      if (extname(fsEntity.name)) {
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          'FileExceptions',
          FileExceptions.FileNotFound,
        );
      }
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.DirNotFound,
      );
    }

    if (linkEntity.expireAt && linkEntity.expireAt < new Date(Date.now())) {
      await this.linkRepository.remove(linkEntity);
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'TokenExceptions',
        TokenExceptions.TokenExpired,
      );
    }

    if (linkEntity.usesLimit) {
      if (linkEntity.usesLimit > 0) {
        linkEntity.usesLimit -= 1;
      } else {
        await this.removeLink(linkEntity);
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          'TokenExceptions',
          TokenExceptions.TokenUsesExceeded,
        );
      }
    }

    if (linkEntity.usesLimit == 0) {
      await this.removeLink(linkEntity);
    }
    await this.linkRepository.save(linkEntity);
    await this.permissionsService.setPermission({
      userUUID: user.UUID,
      driveUUID: fsEntity.ownerUUID,
      name: linkEntity.name,
      role: linkEntity.setRoles,
      permsExpireAt: linkEntity.permsExpireAt,
      linkExpireAt: linkEntity.permsExpireAt,
    });
  }

  async removeLink(linkEntity: LinkEntity) {
    await this.linkRepository.remove(linkEntity);
  }
}
