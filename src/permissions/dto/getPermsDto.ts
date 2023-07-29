import { IsNotEmpty, IsString } from 'class-validator';

export class GetPermsDto {
  @IsString()
  @IsNotEmpty()
  userUUID: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
