import { PermissionsAsStr } from '@/permissions/permissions.constant';
import { Roles } from '@/permissions/roles.constant';
import { Expose } from 'class-transformer';

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
  role: Roles | 'custom';

  @Expose()
  permissions?: PermissionsAsStr[];

  @Expose()
  size: number;

  @Expose()
  isTrashed: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
