import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RolesGuardClass } from '../guards/roles.guard';
import { Roles } from '@/permissions/roles.constant';

export const RolesGuard = (...roles: Roles[]) =>
  applyDecorators(SetMetadata('roles', roles), UseGuards(RolesGuardClass));
