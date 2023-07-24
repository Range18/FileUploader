import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  roles: string;

  @IsBoolean()
  isPrivate?: boolean;

  @IsNumber()
  usesLimit?: number;

  permsExpireIn?: string;

  @IsNumber()
  expireIn?: string;
}
