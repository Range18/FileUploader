import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuardClass } from '../guards/auth.guard';

export const AuthGuard = () => applyDecorators(UseGuards(AuthGuardClass));
