import { RolesGuardClass } from '../guards/roles.guard';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Roles } from '@/permissions/roles.constant';
import { ROLES_METADATA_KEY } from '@/common/constants';

export const RolesGuard = (...roles: Roles[]) =>
  applyDecorators(
    SetMetadata(ROLES_METADATA_KEY, roles),
    UseGuards(RolesGuardClass),
  );
