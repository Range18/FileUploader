import { IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class LoggedUserRdo {
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly accessToken: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly username: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly email: string;
}
