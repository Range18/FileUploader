import {
  HttpStatus,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileSystemEntity } from './entities/fileSystemEntity';
import { FindOneOptions, Like, Repository } from 'typeorm';
import { UserPayload } from '@/user/interfaces/userPayload';
import { UserService } from '@/user/user.service';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import { FileExceptions } from '@/common/Exceptions/ExceptionTypes/FileExceptions';
import { createReadStream, existsSync } from 'fs';
import { extname, join } from 'path';
import { mkdir, readdir, rename, stat, unlink } from 'fs/promises';
import { storageConfig } from '@/common/configs/storageConfig';
import { UserWithoutSession } from '@/user/interfaces/userWithoutSession';
import { diskStorage } from 'multer';
import { Request } from 'express';
import * as uuid4 from 'uuid4';
import { FsEntryDto } from '@/storage/dto/file-directory.dto';
import { UserEntity } from '@/user/entities/user.entity';
import { FsService } from '@/storage/fs.service';
import { TRASH_DIRECTORY_NAME } from '@/storage/storage.constants';
import { PermissionEntity } from '@/permissions/entities/permissions.entity';
import { PermissionsService } from '@/permissions/permissions.service';

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
        const directories = dirname.slice(1).split('\\');
        let checkingPath = '.\\';
        for (let i = 0; i < directories.length; i++) {
          checkingPath += `\\${directories[i]}`;
          if (!existsSync(checkingPath)) {
            callback(
              new NotFoundException('FileException', {
                cause: FileExceptions.DirNotFound,
              }),
              '',
            );
          }
        }
        callback(null, dirname);
      },

      filename: (req, file, callback) => {
        callback(null, `${uuid4()}${extname(file.originalname)}`);
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
        .catch(async (err) => {
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
      ownerUUID: user.UUID,
      originalName: isFolder
        ? file.originalname.split('.')[0]
        : file.originalname,
      name: isFolder ? file.filename.split('.')[0] : file.filename,
      destination: destination,
      type: isFolder ? 'folder' : file.mimetype,
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

    const file = createReadStream(
      join(storageConfig.storagePath, fileEntity.destination, fileEntity.name),
    );

    return { buffer: new StreamableFile(file), mimetype: fileEntity.type };
  }

  async getFileSystemEntity(options: FindOneOptions) {
    return this.filesRepository.findOne(options);
  }

  async createDefaultStorage(
    user: UserPayload | UserWithoutSession | UserEntity,
  ) {
    await mkdir(`${storageConfig.storagePath}/${user.UUID}`);
    await mkdir(
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
        FileExceptions.DirAlreadyExists,
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
        FileExceptions.DirNotFound,
      );
    }

    const folderEntity = await this.filesRepository.save({
      ownerUUID: driveId,
      originalName: dirname,
      name: uuid4(),
      destination: `${driveId}/${path}/`,
      type: 'folder',
      size: 0,
    });

    await mkdir(
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
            FileExceptions.ObjectAccessFail,
          );
        }

        const oldDest = `${storageConfig.storagePath}/${fileEntity.destination}/${fileEntity.name}`;
        const newDest = `${storageConfig.storagePath}/${fileEntity.ownerUUID}/${newPath}/${fileEntity.name}`;

        await rename(oldDest, newDest);

        if (fileEntity.type === 'folder') {
          const fileEntities: FileSystemEntity[] =
            await this.filesRepository.find({
              where: { destination: Like(`%${fileEntity.name}%`) },
            });
          fileEntities.forEach(
            (elem) =>
              (elem.destination = `${fileEntity.ownerUUID}${newPath}/${
                fileEntity.name
              }${elem.destination.split('\\').slice(2).join('\\')}/`),
          );
          await this.filesRepository.save(fileEntities);
        }

        fileEntity.destination = `${fileEntity.ownerUUID}${newPath}/`;
        await this.filesRepository.save(fileEntity);
        break;
      }

      case 'trash': {
        const oldDest = `${storageConfig.storagePath}/${fileEntity.destination}/${fileEntity.name}`;
        const newDest = `${storageConfig.storagePath}/${fileEntity.ownerUUID}/${TRASH_DIRECTORY_NAME}/${fileEntity.name}`;

        await rename(oldDest, newDest);
        break;
      }
      case 'untrash': {
        const oldDest = `${storageConfig.storagePath}/${fileEntity.ownerUUID}/${TRASH_DIRECTORY_NAME}/${fileEntity.name}`;
        const newDest = `${storageConfig.storagePath}/${fileEntity.destination}/${fileEntity.name}`;

        await rename(oldDest, newDest);
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

    if (fileEntity.isTrashed) {
      await unlink(
        `${storageConfig.storagePath}/${fileEntity.ownerUUID}/${TRASH_DIRECTORY_NAME}/${fileEntity.name}`,
      );
    } else {
      await unlink(
        `${storageConfig.storagePath}/${fileEntity.destination}${fileEntity.name}`,
      );
    }

    await this.filesRepository.remove(fileEntity);
    return fileEntity;
  }

  async getDirContent(path: string) {
    if (
      !(await this.fsService.checkPathExists(
        `${storageConfig.storagePath}/${path}`,
      ))
    ) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'FileExceptions',
        FileExceptions.DirNotFound,
      );
    }

    const dirContent = await readdir(`${storageConfig.storagePath}/${path}`);
    const driveUUID = path.split('/')[0];
    const indexOfTrash = dirContent.indexOf(TRASH_DIRECTORY_NAME);

    if (indexOfTrash > -1) {
      dirContent.splice(indexOfTrash, 1);
    }

    const dirContentDto: FsEntryDto[] = [];

    for (let i = 0; i < dirContent.length; i++) {
      const objInfo = await stat(
        `${storageConfig.storagePath}/${path}/${dirContent[i]}`,
      );

      if (objInfo.isFile()) {
        const file = await this.filesRepository.findOne({
          where: { name: dirContent[i] },
        });

        dirContentDto.push({
          driveUUID: driveUUID,
          type: 'file',
          name: dirContent[i],
          originalName: file.originalName,
          extname: extname(dirContent[i]),
          path: file.destination,
          role: 'owner',
          size: file.size,
          updatedAt: file.updatedAt,
          createdAt: file.createdAt,
        });
      } else {
        dirContentDto.push({
          driveUUID: driveUUID,
          type: 'folder',
          originalName: dirContent[i],
          path: `${path}${dirContent[i]}`,
          role: 'owner',
          size: objInfo.size,
          updatedAt: objInfo.mtime,
          createdAt: objInfo.birthtime,
        });
      }
    }

    return dirContentDto;
  }
  async setOriginalNames(permissionEntities: PermissionEntity[]) {
    for (const permissionEntity of permissionEntities) {
      const fileEntity = await this.filesRepository.findOne({
        where: { name: permissionEntity.name },
      });
      const index = permissionEntities.indexOf(permissionEntity);

      if (!fileEntity) {
        permissionEntities.splice(index, 1);
        await this.permissionsService.remove(permissionEntity);
      }

      permissionEntities[index].name = fileEntity.originalName;
    }

    return permissionEntities;
  }
}
