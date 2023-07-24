import { IsString, IsUUID } from 'class-validator';

export class GetPermsDto {
  @IsString()
  userUUID: string;

  @IsUUID()
  driveId: string;

  @IsString()
  name: string;
}
