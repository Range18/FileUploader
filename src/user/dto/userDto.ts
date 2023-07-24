import { UserPayload } from '../interfaces/userPayload';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  readonly accessToken: string;

  @IsNotEmpty()
  public user: UserPayload;

  constructor(accessToken: string, user: UserPayload) {
    this.accessToken = accessToken;
    this.user = user;
  }
}
