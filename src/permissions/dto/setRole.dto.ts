import { IsDate, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SetRoleDto {
  @IsUUID()
  @IsNotEmpty()
  userUUID: string;

  @IsUUID()
  @IsNotEmpty()
  driveUUID: string;

  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsDate()
  permsExpireAt?: Date;

  @IsDate()
  linkExpireAt?: Date;
}
