import { IsString } from 'class-validator';

export class GetPermsDto {
  @IsString()
  userUUID: string;

  @IsString()
  name: string;
}
