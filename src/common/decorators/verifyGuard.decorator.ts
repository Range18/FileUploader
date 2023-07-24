import { applyDecorators, UseGuards } from '@nestjs/common';
import { VerificationGuard } from '../guards/verifiction.guard';

export const IsVerified = () => applyDecorators(UseGuards(VerificationGuard));
