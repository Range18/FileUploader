import { SessionEntity } from '@/session/entities/sessions.entity';
import { Expose } from 'class-transformer';

export class GetSessionRdo {
  @Expose()
  ip: string;

  @Expose()
  userAgent: string;

  @Expose()
  expireAt: Date;

  @Expose()
  createdAt: Date;

  constructor(session: SessionEntity) {
    this.ip = session.ip;
    this.userAgent = session.agent;
    this.expireAt = session.expireAt;
    this.createdAt = session.createdAt;
  }
}
