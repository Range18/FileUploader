import { FileSystemEntity } from './entities/fileSystemEntity';
import {
  HttpStatus,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserPayload } from '@/user/userPayload';
import { UserService } from '@/user/user.service';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import { FileExceptions } from '@/common/Exceptions/ExceptionTypes/FileExceptions';
import { storageConfig } from '@/common/configs/storageConfig';
import { UserEntity } from '@/user/entities/user.entity';
import { FsService } from '@/storage/fs.service';
import {
  FILE_NAMES_SIZE,
  TRASH_DIRECTORY_NAME,
} from '@/storage/storage.constants';
import { PermissionEntity } from '@/permissions/entities/permissions.entity';
import { PermissionsService } from '@/permissions/permissions.service';
import { FileRdo } from '@/storage/rdo/file.rdo';
import { Roles } from '@/permissions/roles.constant';
import { uid } from 'uid';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { FindOneOptions, Like, Repository } from 'typeorm';
import { readdir, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { createReadStream } from 'fs';

@Injectable()
export class StorageService {
  static readonly multerOptions = {
    storage: diskStorage({
      destination: async (
        req: Request,
        file: Express.Multer.File,
        callback,
      ) => {
        // Create folder if it doesn't exist
        if (
          !(await stat(storageConfig.storagePath)
            .then(() => true)
            .catch(() => false))
        ) {
          throw new NotFoundException(
            `Storage directory \" ${storageConfig.storagePath} \" not found`,
          );
        }

        const user: UserPayload = req['user'];
        const path: string = (req.query['path'] as string) ?? '';

        const storageId: string =
          Boolean(req.query['storageId']) === false
            ? user.UUID
            : (req.query['storageId'] as string);

        if (
          !(await stat(`${storageConfig.storagePath}/${storageId}/`)
            .then(() => true)
            .catch(() => false))
        ) {
          callback(
            new NotFoundException('FileException', {
              cause: FileExceptions.StorageNotFound,
            }),
            '',
          );
        }

        const dirname = `${storageConfig.storagePath}/${storageId}${path}`;
        if (
          !stat(dirname)
            .then(() => true)
            .catch(() => false)
        ) {
          callback(
            new NotFoundException('FileException', {
              cause: FileExceptions.FileNotFound,
            }),
            '',
          );
        }
        callback(null, dirname);
      },

      filename: (req, file, callback) => {
        callback(null, `${uid(FILE_NAMES_SIZE)}${extname(file.originalname)}`);
      },
    }),
  };

  constructor(
    @InjectRepository(FileSystemEntity)
    private readonly filesRepository: Repository<FileSystemEntity>,
    private readonly userService: UserService,
    private readonly fsService: FsService,
    private readonly permissionsService: PermissionsService,
  ) {}
  async saveFileSystemEntity(
    file: Express.Multer.File,
    destination: string,
    user: UserPayload,
    isFolder: boolean,
  ): Promise<void> {
    const userEntity = await this.userService.findByUUID(user.UUID);
    if (!userEntity) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }
    if (isFolder) {
      const unzipToDir = `${file.destination}`;
      await this.fsService
        .saveAsFolder(file, destination, unzipToDir, user.UUID)
        .catch((err) => {
          console.log(err);
          throw new ApiException(
            HttpStatus.BAD_REQUEST,
            'FileExceptions',
            FileExceptions.SomethingWhileUnpacking,
          );
        });
      return;
    }
    await this.filesRepository.save({
      driveUUID: user.UUID,
      originalName: file.originalname,
      name: file.filename,
      destination: normalize(destination),
      type: file.mimetype,
      size: file.size,
    });
  }

  async getFile(
    fileName: string,
  ): Promise<{ buffer: StreamableFile; mimetype: string }> {
    const fileEntity = await this.filesRepository.findOneBy({
      name: fileName,
    });

    if (!fileEntity) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.FileNotFound,
      );
    }

    let fileDest: string;

    if (fileEntity.type === 'folder') {
      fileDest = await this.fsService.zipFolder(fileEntity);
    } else {
      fileDest = join(
        storageConfig.storagePath,
        fileEntity.destination,
        fileEntity.name,
      );
    }

    return {
      buffer: new StreamableFile(createReadStream(fileDest)),
      mimetype: fileEntity.type,
    };
  }

  async downloadPersonalData(userUUID: string) {
    const user = await this.userService.findByUUID(userUUID);

    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }

    const dataPath = join(storageConfig.storagePath, userUUID);

    if (!(await this.fsService.checkPathExists(dataPath))) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.StorageNotFound,
      );
    }

    const zippedDataPath = await this.fsService.zipFolder(dataPath);

    return { buffer: new StreamableFile(createReadStream(zippedDataPath)) };
  }

  async getFileSystemEntity(options: FindOneOptions<FileSystemEntity>) {
    return this.filesRepository.findOne(options);
  }

  async createDefaultStorage(user: UserPayload | UserEntity) {
    await this.fsService.mkDir(`${storageConfig.storagePath}/${user.UUID}`);
    await this.fsService.mkDir(
      `${storageConfig.storagePath}/${user.UUID}/${TRASH_DIRECTORY_NAME}`,
    );
    this.fsService.makeFileInvisible(
      `${storageConfig.storagePath}/${user.UUID}/${TRASH_DIRECTORY_NAME}`,
    );
  }

  async mkDir(driveId: string, path: string, dirname: string) {
    if (
      !(await this.fsService.checkPathExists(
        `${storageConfig.storagePath}/${driveId}/${path}/${dirname}`,
      ))
    ) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'FileExceptions',
        FileExceptions.FileAlreadyExists,
      );
    }

    if (
      !(await this.fsService.checkPathExists(
        `${storageConfig.storagePath}/${driveId}/${path}/`,
      ))
    ) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.FileNotFound,
      );
    }

    const folderEntity = await this.filesRepository.save({
      driveUUID: driveId,
      originalName: dirname,
      name: uid(FILE_NAMES_SIZE),
      destination: `${driveId}/${path}/`,
      type: 'folder',
      size: 0,
    });

    await this.fsService.mkDir(
      `${storageConfig.storagePath}/${driveId}/${path}/${folderEntity.name}`,
    );
  }

  // Move files, also trash or unTrash files
  async moveFile(
    fileEntity: FileSystemEntity,
    operation: 'move',
    newPath: string,
  ): Promise<void>;
  async moveFile(
    filename: string,
    operation: 'move',
    newPath: string,
  ): Promise<void>;
  async moveFile(
    fileEntity: FileSystemEntity,
    operation: 'trash' | 'untrash',
  ): Promise<void>;
  async moveFile(
    filenameOrEntity: string | FileSystemEntity,
    operation: 'trash' | 'untrash' | 'move' = 'move',
    newPath = '/',
  ): Promise<void> {
    const fileEntity =
      typeof filenameOrEntity == 'string'
        ? await this.getFileSystemEntity({
            where: { name: filenameOrEntity },
          })
        : filenameOrEntity;

    if (!fileEntity) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.FileNotFound,
      );
    }

    switch (operation) {
      case 'move': {
        if (fileEntity.isTrashed) {
          throw new ApiException(
            HttpStatus.BAD_REQUEST,
            'FileExceptions',
            FileExceptions.FileTrashed,
          );
        }

        if (newPath.includes(TRASH_DIRECTORY_NAME)) {
          throw new ApiException(
            HttpStatus.FORBIDDEN,
            'FileExceptions',
            FileExceptions.AccessFail,
          );
        }

        const oldDest = `${storageConfig.storagePath}/${fileEntity.destination}/${fileEntity.name}`;
        const newDest = `${storageConfig.storagePath}/${fileEntity.driveUUID}/${newPath}/${fileEntity.name}`;

        await this.fsService.moveFile(oldDest, newDest);

        if (fileEntity.type === 'folder') {
          const fileEntities: FileSystemEntity[] =
            await this.filesRepository.find({
              where: { destination: Like(`%${fileEntity.name}%`) },
            });

          fileEntities.forEach(
            (elem) =>
              (elem.destination = normalize(
                join(
                  fileEntity.driveUUID,
                  newPath,
                  elem.destination.split('\\').slice(2).join('\\'),
                ),
              )),
          );

          await this.filesRepository.save(fileEntities);
        }

        fileEntity.destination = normalize(join(fileEntity.driveUUID, newPath));
        await this.filesRepository.save(fileEntity);
        break;
      }

      case 'trash': {
        const oldDest = `${storageConfig.storagePath}/${fileEntity.destination}/${fileEntity.name}`;
        const newDest = `${storageConfig.storagePath}/${fileEntity.driveUUID}/${TRASH_DIRECTORY_NAME}/${fileEntity.name}`;

        await this.fsService.moveFile(oldDest, newDest);
        break;
      }
      case 'untrash': {
        const oldDest = `${storageConfig.storagePath}/${fileEntity.driveUUID}/${TRASH_DIRECTORY_NAME}/${fileEntity.name}`;
        const newDest = `${storageConfig.storagePath}/${fileEntity.destination}/${fileEntity.name}`;

        await this.fsService.moveFile(oldDest, newDest);
        break;
      }
    }
  }

  async trashFile(filename: string) {
    const fileEntity = await this.getFileSystemEntity({
      where: { name: filename },
    });

    if (!fileEntity) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.FileNotFound,
      );
    }

    if (fileEntity.isTrashed) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'FileExceptions',
        FileExceptions.FileAlreadyTrashed,
      );
    }

    await this.moveFile(fileEntity, 'trash');

    if (fileEntity.type == 'folder') {
      const fileEntities: FileSystemEntity[] = await this.filesRepository.find({
        where: { destination: Like(`%${fileEntity.name}%`) },
      });

      fileEntities.forEach((entity) => (entity.isTrashed = true));

      await this.filesRepository.save(fileEntities);
    }

    const permissionEntities: PermissionEntity[] =
      await this.permissionsService.find({ where: { name: fileEntity.name } });

    permissionEntities.forEach((permission) => (permission.isTrashed = true));
    await this.permissionsService.save(permissionEntities);

    fileEntity.isTrashed = true;
    await this.filesRepository.save(fileEntity);
  }

  async unTrashFile(filename: string) {
    const fileEntity = await this.getFileSystemEntity({
      where: { name: filename },
    });

    if (!fileEntity) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.FileNotFound,
      );
    }

    if (!fileEntity.isTrashed) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'FileExceptions',
        FileExceptions.FileNotTrashed,
      );
    }

    await this.moveFile(fileEntity, 'untrash');

    if (fileEntity.type == 'folder') {
      const fileEntities: FileSystemEntity[] = await this.filesRepository.find({
        where: { destination: Like(`%${fileEntity.name}%`) },
      });

      fileEntities.forEach((elem) => (elem.isTrashed = false));
      await this.filesRepository.save(fileEntities);
    }

    const permissionEntities: PermissionEntity[] =
      await this.permissionsService.find({ where: { name: fileEntity.name } });

    permissionEntities.forEach((permission) => (permission.isTrashed = false));
    await this.permissionsService.save(permissionEntities);

    fileEntity.isTrashed = false;
    await this.filesRepository.save(fileEntity);
  }
  async deleteFile(filenameOrEntity: string | FileSystemEntity) {
    const fileSystemEntity =
      typeof filenameOrEntity == 'string'
        ? await this.getFileSystemEntity({
            where: { name: filenameOrEntity },
          })
        : filenameOrEntity;

    if (!fileSystemEntity) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.FileNotFound,
      );
    }

    try {
      if (fileSystemEntity.isTrashed) {
        await this.fsService.deleteFile(
          `${storageConfig.storagePath}/${fileSystemEntity.driveUUID}/${TRASH_DIRECTORY_NAME}/${fileSystemEntity.name}`,
        );
      } else {
        await this.fsService.deleteFile(
          `${storageConfig.storagePath}/${fileSystemEntity.destination}${fileSystemEntity.name}`,
        );
      }
    } catch (err) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.FileNotFound,
      );
    }

    await this.filesRepository.remove(fileSystemEntity);
    return fileSystemEntity;
  }

  async getDirectoryContent(path: string): Promise<FileRdo[]> {
    if (
      !(await this.fsService.checkPathExists(
        `${storageConfig.storagePath}/${path}`,
      ))
    ) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.FileNotFound,
      );
    }

    const dirContent = await readdir(`${storageConfig.storagePath}/${path}`);
    const indexOfTrash = dirContent.indexOf(TRASH_DIRECTORY_NAME);

    if (indexOfTrash > -1) {
      dirContent.splice(indexOfTrash, 1);
    }

    const dirContentDto: FileRdo[] = [];

    for (let i = 0; i < dirContent.length; i++) {
      const fileSystemEntity = await this.filesRepository.findOne({
        where: { name: dirContent[i] },
      });

      const permsEntity = await this.permissionsService.findOne({
        where: { name: fileSystemEntity.name },
      });

      dirContentDto.push({
        driveUUID: fileSystemEntity.driveUUID,
        type: fileSystemEntity.type,
        name: dirContent[i],
        originalName: fileSystemEntity.originalName,
        extname: extname(dirContent[i]),
        destination: fileSystemEntity.destination,
        role: permsEntity ? <Roles>permsEntity.role : 'owner',
        isTrashed: fileSystemEntity.isTrashed,
        size: fileSystemEntity.size,
        updatedAt: fileSystemEntity.updatedAt,
        createdAt: fileSystemEntity.createdAt,
      });
    }

    return dirContentDto;
  }
  formatPermEntities(
    permissionEntities: PermissionEntity[],
  ): Promise<FileRdo>[] {
    return permissionEntities.map(
      async (permissionEntity): Promise<FileRdo> => {
        const fileEntity = await this.filesRepository.findOne({
          where: { name: permissionEntity.name },
        });

        if (!fileEntity) {
          const index = permissionEntities.indexOf(permissionEntity);
          permissionEntities.splice(index, 1);
          await this.permissionsService.remove(permissionEntity);
        }
        return {
          driveUUID: fileEntity.driveUUID,
          originalName: fileEntity.originalName,
          name: fileEntity.name,
          destination: fileEntity.destination,
          type: fileEntity.type,
          size: fileEntity.size,
          isTrashed: fileEntity.isTrashed,
          extname: extname(fileEntity.originalName),
          role: <Roles>permissionEntity.role,
          updatedAt: fileEntity.updatedAt,
          createdAt: fileEntity.createdAt,
        };
      },
    );
  }
}
