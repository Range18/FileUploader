import { IsDate, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SetPermsDto {
  @IsUUID()
  @IsNotEmpty()
  userUUID: string;

  @IsUUID()
  @IsNotEmpty()
  driveUUID: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  permissions: number;

  @IsDate()
  permsExpireAt?: Date;

  @IsDate()
  linkExpireAt?: Date;
}
