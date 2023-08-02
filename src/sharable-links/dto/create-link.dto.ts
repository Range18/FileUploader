import { IsTypeOf } from '@/common/decorators/class-validator/IsTypeOf.decorator';
import { InCompatibleWith } from '@/common/decorators/class-validator/InCompatibleWith.decorator';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { StringValue } from 'ms';
import { Transform } from 'class-transformer';

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  roles: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @InCompatibleWith(['userToShare', 'usesLimit', 'permsExpireIn', 'expireIn'])
  @IsOptional()
  isPrivate?: boolean;

  @IsEmail()
  @IsString()
  @InCompatibleWith(['isPrivate', 'usesLimit'])
  @IsOptional()
  userToShare?: string;

  @IsNumber()
  @IsOptional()
  usesLimit?: number;

  @IsTypeOf('StringValue')
  @IsString()
  @IsOptional()
  permsExpireIn?: StringValue;

  @IsTypeOf('StringValue')
  @IsString()
  @IsOptional()
  expireIn?: StringValue;
}
