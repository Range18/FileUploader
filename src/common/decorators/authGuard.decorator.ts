import { AuthGuardClass } from '../guards/auth.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';

export const AuthGuard = () => applyDecorators(UseGuards(AuthGuardClass));
