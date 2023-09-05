import { FileSystemEntity } from '@/storage/entities/fileSystemEntity';

export type RootDirType = Pick<
  FileSystemEntity,
  'name' | 'destination' | 'isTrashed'
>;

export type RootDirWithDriveId = RootDirType & { owner: string };
