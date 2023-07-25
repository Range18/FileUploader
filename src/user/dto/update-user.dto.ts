import { IsNotEmpty } from 'class-validator';

export class updateUserDto {
  @IsNotEmpty()
  readonly property: string;
  @IsNotEmpty()
  readonly newProperty: string;
}
