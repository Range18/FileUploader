import {
  Body,
  Controller,
  Delete,
  Get,
  ParseFilePipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@/common/decorators/authGuard.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserPayload } from '@/user/userPayload';
import { User } from '@/common/decorators/User.decorator';
import { StorageService } from './storage.service';
import { RolesGuard } from '@/common/decorators/rolesGuard.decorator';
import { Response } from 'express';
import { MakeDirDto } from '@/storage/dto/makeDir.dto';
import { SetDefaultStorageQueryInterceptor } from '@/common/interceptors/setDefaultStorageQuery.interceptor';
import { PermissionsService } from '@/permissions/permissions.service';
import { FileRdo } from '@/storage/rdo/file.rdo';
import { IsVerified } from '@/common/decorators/verifyGuard.decorator';

@Controller('drive')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly permissionsService: PermissionsService,
  ) {}

  //Create Data
  @UseInterceptors(FileInterceptor('file', StorageService.multerOptions))
  @UseInterceptors(SetDefaultStorageQueryInterceptor)
  @RolesGuard('editor', 'owner')
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
    @Query('storageId') storageId: string,
    @Query('path') path: string,
    @Query('isFolder') isFolder: boolean,
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
  // @RolesGuard('reader', 'editor', 'owner')
  // @IsVerified()
  // @AuthGuard()
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
    return await this.storageService.getFileSystemEntity({
      where: { name: filename },
    });
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
  @UseInterceptors(SetDefaultStorageQueryInterceptor)
  @IsVerified()
  @AuthGuard()
  @Get('get/dir')
  async getDirContent(
    @Query('storageId') storageId: string,
    @Query('path') path: string,
  ): Promise<FileRdo[]> {
    return await this.storageService.getDirectoryContent(
      `${storageId}/${path}`,
    );
  }

  @RolesGuard('owner')
  @IsVerified()
  @AuthGuard()
  @Delete('delete')
  async deleteFile(@Query('filename') filename: string) {
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
}
