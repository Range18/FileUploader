import { Roles } from '@/permissions/roles.constant';

export class FsEntryDto {
  driveUUID: string;
  type: 'file' | 'folder';
  originalName: string;
  name?: string;
  extname?: string;
  role: Roles;
  path: string;
  size: number;
  updatedAt: Date;
  createdAt: Date;
}
