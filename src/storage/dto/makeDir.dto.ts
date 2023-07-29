import { IsNotEmpty, IsString } from 'class-validator';

export class MakeDirDto {
  @IsString()
  @IsNotEmpty()
  storageId: string;

  @IsString()
  @IsNotEmpty()
  path = '/';

  @IsString()
  @IsNotEmpty()
  dirname: string;
}
