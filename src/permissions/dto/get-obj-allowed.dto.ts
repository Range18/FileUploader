import { Roles } from '@/permissions/roles.constant';

export class GetObjAllowedDto {
  driveUUID: string;
  type: 'file' | 'folder';
  originalName: string;
  name?: string;
  extname?: string;
  role: Omit<Roles, 'owner'>;
  path: string;
  size: string;
  updatedAt: Date;
  createdAt: Date;
}
