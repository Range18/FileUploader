import { VerificationGuard } from '../guards/verifiction.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';

export const IsVerified = () => applyDecorators(UseGuards(VerificationGuard));
