import { PermissionsService } from './permissions.service';
import { Controller } from '@nestjs/common';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}
}
