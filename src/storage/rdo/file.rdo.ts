import { Expose } from 'class-transformer';
import { Roles } from '@/permissions/roles.constant';

export class FileRdo {
  @Expose()
  driveUUID: string;

  @Expose()
  originalName: string;

  @Expose()
  name: string;

  @Expose()
  destination: string;

  @Expose()
  type: string;

  @Expose()
  extname?: string;

  @Expose()
  role?: Roles;

  @Expose()
  size: number;

  @Expose()
  isTrashed: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
