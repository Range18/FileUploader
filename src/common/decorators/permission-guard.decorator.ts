import { PermissionGuardClass } from '../guards/permission.guard';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { PERMS_METADATA_KEY } from '@/common/constants';
import { Permissions } from '@/permissions/permissions.constant';

export const PermissionGuard = (...permissions: Permissions[] | ['owner']) =>
  applyDecorators(
    SetMetadata(PERMS_METADATA_KEY, permissions),
    UseGuards(PermissionGuardClass),
  );
