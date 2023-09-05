import { IsNotEmpty, IsString } from 'class-validator';

export class MakeDirDto {
  @IsString()
  @IsNotEmpty()
  whereToCreate: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
