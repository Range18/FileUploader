import { IsNotEmpty, IsString } from 'class-validator';

export class MoveFileDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  dirname: string;
}
