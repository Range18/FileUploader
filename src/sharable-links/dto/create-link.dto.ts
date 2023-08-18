import { IsTypeOf } from '@/common/decorators/class-validator/IsTypeOf.decorator';
import { InCompatibleWith } from '@/common/decorators/class-validator/InCompatibleWith.decorator';
import { PermissionsAsStr } from '@/permissions/permissions.constant';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { StringValue } from 'ms';

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsTypeOf('PermissionsAsStr')
  @IsArray()
  @IsNotEmpty()
  permissions: PermissionsAsStr[];

  @IsEmail()
  @IsString()
  @InCompatibleWith(['usesLimit', 'expireIn'])
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
