import { Expose } from 'class-transformer';

export class GetUserRdo {
  @Expose()
  readonly username: string;
  @Expose()
  readonly email: string;
  @Expose()
  readonly UUID: string;
}
