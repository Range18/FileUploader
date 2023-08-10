import { StorageService } from './storage.service';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  ParseBoolPipe,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@/common/decorators/authGuard.decorator';
import { UserPayload } from '@/user/userPayload';
import { User } from '@/common/decorators/User.decorator';
import { RolesGuard } from '@/common/decorators/rolesGuard.decorator';
import { MakeDirDto } from '@/storage/dto/makeDir.dto';
import { PermissionsService } from '@/permissions/permissions.service';
import { FileRdo } from '@/storage/rdo/file.rdo';
import { IsVerified } from '@/common/decorators/verifyGuard.decorator';
import { Roles } from '@/permissions/roles.constant';
import { SetStorageIdInterceptor } from '@/common/interceptors/set-storageid.interceptor';
import { Response } from 'express';
import { extname } from 'path';

@Controller('drive')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly permissionsService: PermissionsService,
  ) {}

  //Create Data
  @UseInterceptors(FileInterceptor('file', StorageService.multerOptions))
  @RolesGuard('editor', 'owner')
  @UseInterceptors(SetStorageIdInterceptor)
  @IsVerified()
  @AuthGuard()
  @Post('upload')
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
      }),
    )
    file: Express.Multer.File,
    @Query('storageId', new ParseUUIDPipe())
    storageId: string,
    @Query('path', new DefaultValuePipe('/')) path: string,
    @Query('isFolder', new DefaultValuePipe(false), new ParseBoolPipe())
    isFolder: boolean,
    @User() user: UserPayload,
  ) {
    await this.storageService.saveFileSystemEntity(
      file,
      storageId + path,
      user,
      isFolder,
    );
  }

  @RolesGuard('editor', 'owner')
  @IsVerified()
  @AuthGuard()
  @Post('mkdir')
  async mkDir(@Body() makeDirDto: MakeDirDto, @User() user: UserPayload) {
    await this.storageService.mkDir(
      makeDirDto.storageId ?? user.UUID,
      makeDirDto.path,
      makeDirDto.dirname,
    );
  }

  //Fetch Data
  @RolesGuard('reader', 'editor', 'owner')
  @IsVerified()
  @AuthGuard()
  @Get('get')
  async getFile(
    @Query('name') filename: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, mimetype } = await this.storageService.getFile(filename);

    if (mimetype === 'folder') {
      res.set({
        'Content-Type': 'application/zip',
      });
    } else if (!mimetype) {
      res.set({
        'Content-Type': 'text/plain',
      });
    } else {
      res.set({
        'Content-Type': `${mimetype}`,
      });
    }

    return buffer;
  }

  @RolesGuard('reader', 'editor', 'owner')
  @IsVerified()
  @AuthGuard()
  @Get('get/info')
  async getFileData(@Query('name') filename: string): Promise<FileRdo> {
    const fileEntity = await this.storageService.getFileSystemEntity({
      where: { name: filename },
      loadRelationIds: { relations: ['owner'] },
    });
    const permsEntity = await this.permissionsService.findOne({
      where: { name: filename },
    });

    return {
      driveUUID: fileEntity.owner as unknown as string,
      name: fileEntity.name,
      originalName: fileEntity.originalName,
      destination: fileEntity.destination,
      type: fileEntity.type,
      size: fileEntity.size,
      isTrashed: fileEntity.isTrashed,
      createdAt: fileEntity.createdAt,
      updatedAt: fileEntity.updatedAt,
      extname: extname(fileEntity.name),
      role: permsEntity ? <Roles>permsEntity.role : 'owner',
    };
  }

  @RolesGuard('editor', 'owner')
  @IsVerified()
  @AuthGuard()
  @Delete('trash')
  async trashFile(@Query('name') filename: string) {
    return await this.storageService.trashFile(filename);
  }

  @RolesGuard('editor', 'owner')
  @IsVerified()
  @AuthGuard()
  @Post('recover')
  async unTrashFile(@Query('name') filename: string) {
    return await this.storageService.unTrashFile(filename);
  }

  @RolesGuard('editor', 'owner')
  @IsVerified()
  @AuthGuard()
  @Post('move')
  async moveFile(
    @Query('name') filename: string,
    @Query('newPath') newPath: string,
  ) {
    return await this.storageService.moveFile(filename, 'move', newPath);
  }

  @RolesGuard('reader', 'editor', 'owner')
  @UseInterceptors(SetStorageIdInterceptor)
  @IsVerified()
  @AuthGuard()
  @Get('get/dir')
  async getDirContent(
    @Query('storageId', new ParseUUIDPipe())
    storageId: string,
    @Query('path', new DefaultValuePipe('/')) path: string,
  ): Promise<FileRdo[]> {
    return await this.storageService.getDirectoryContent(
      `${storageId}/${path}`,
    );
  }

  @RolesGuard('owner')
  @IsVerified()
  @AuthGuard()
  @Delete('delete')
  async deleteFile(@Query('name') filename: string) {
    await this.storageService.deleteFile(filename);
  }

  @Get('get/shared/')
  @IsVerified()
  @AuthGuard()
  async getObjUserAllowed(@User() user: UserPayload) {
    const permissionEntities = await this.permissionsService.getAvailable(
      user.UUID,
    );
    return await this.storageService.formatPermEntities(permissionEntities);
  }

  @RolesGuard('owner')
  @IsVerified()
  @AuthGuard()
  @Get('download/data')
  async downloadUserData(
    @Res({ passthrough: true }) res: Response,
    @User() user: UserPayload,
  ) {
    const { buffer } = await this.storageService.downloadPersonalData(
      user.UUID,
    );

    res.set({
      'Content-Type': 'application/zip',
    });

    return buffer;
  }
}
