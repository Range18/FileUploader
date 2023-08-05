import { LinkEntity } from './entities/link.entity';
import { CreateLinkDto } from './dto/create-link.dto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiException } from '@/common/Exceptions/ApiException';
import { TokenExceptions } from '@/common/Exceptions/ExceptionTypes/TokenExceptions';
import { PermissionsService } from '@/permissions/permissions.service';
import { UserPayload } from '@/user/userPayload';
import { FileExceptions } from '@/common/Exceptions/ExceptionTypes/FileExceptions';
import { StorageService } from '@/storage/storage.service';
import { MailService } from '@/mail/mail.service';
import { OtherExceptions } from '@/common/Exceptions/ExceptionTypes/OtherExceptions';
import ms from 'ms';
import { Repository } from 'typeorm';

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(LinkEntity)
    private readonly linkRepository: Repository<LinkEntity>,
    private readonly storageService: StorageService,
    private readonly permissionsService: PermissionsService,
    private readonly mailService: MailService,
  ) {}

  async createLink(userUUID: string, createLinkDto: CreateLinkDto) {
    const fsEntity = await this.storageService.getFileSystemEntity({
      where: { name: createLinkDto.name },
    });

    if (!fsEntity) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.FileNotFound,
      );
    }

    const linkEntity = await this.linkRepository.save({
      userShared: userUUID,
      name: fsEntity.name,
      setRoles: createLinkDto.roles,
      isPrivate: createLinkDto.isPrivate,
      userToShare: createLinkDto.userToShare,
      usesLimit: createLinkDto.usesLimit,
      permsExpireAt: createLinkDto.permsExpireIn
        ? new Date(Date.now() + ms(createLinkDto.permsExpireIn))
        : createLinkDto.permsExpireIn,
      expireAt: createLinkDto.expireIn
        ? new Date(Date.now() + ms(createLinkDto.expireIn))
        : createLinkDto.expireIn,
    });

    if (createLinkDto.userToShare) {
      await this.mailService.sendSharingFileEmail(
        createLinkDto.userToShare,
        linkEntity.link,
      );
    }
    return linkEntity;
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

    if (linkEntity.userShared === user.UUID) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        'OtherExceptions',
        OtherExceptions.PermissionOwnerAlready,
      );
    }

    const fsEntity = await this.storageService.getFileSystemEntity({
      where: { name: linkEntity.name },
    });

    if (!fsEntity || fsEntity.isTrashed) {
      await this.linkRepository.remove(linkEntity);

      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.FileNotFound,
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

    if (linkEntity.usesLimit === 0) {
      await this.removeLink(linkEntity);
    } else {
      await this.linkRepository.save(linkEntity);
    }

    if (linkEntity.isPrivate) {
      const permissionOfUser = await this.permissionsService.findOne({
        where: { userUUID: user.UUID },
      });

      if (!permissionOfUser) {
        await this.linkRepository.save(linkEntity);

        throw new ApiException(
          HttpStatus.FORBIDDEN,
          'FileExceptions',
          FileExceptions.AccessFail,
        );
      }
    }

    if (linkEntity.userToShare && user.email !== linkEntity.userToShare) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'FileExceptions',
        FileExceptions.AccessFail,
      );
    }

    await this.permissionsService.setPermission({
      userUUID: user.UUID,
      driveUUID: fsEntity.owner.UUID,
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
