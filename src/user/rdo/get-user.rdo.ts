import { UserEntity } from '@/user/entities/user.entity';
import { Expose } from 'class-transformer';

export class GetUserRdo {
  @Expose()
  readonly username: string;
  @Expose()
  readonly email: string;
  @Expose()
  readonly UUID: string;

  constructor(entity: UserEntity) {
    this.username = entity.username;
    this.email = entity.email;
    this.UUID = entity.UUID;
  }
}
