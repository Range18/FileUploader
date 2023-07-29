import { IsNotEmpty, IsString } from 'class-validator';

export class updateUserDto {
  @IsString()
  @IsNotEmpty()
  readonly property: string;
  @IsString()
  @IsNotEmpty()
  readonly newProperty: string;
}
