import { PermissionsService } from './permissions.service';
import { Body, Controller, Delete } from '@nestjs/common';
import { DeletePermsDto } from '@/permissions/dto/delete-perms.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Delete('delete')
  async removePermissions(@Body() deletePermsDto: DeletePermsDto) {
    await this.permissionsService.remove({
      where: {
        userUUID: deletePermsDto.userUUID,
        name: deletePermsDto.filename,
      },
    });
  }
}
