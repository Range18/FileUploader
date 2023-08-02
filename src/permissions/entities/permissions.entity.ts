import { DEFAULT_FILE_NAME } from '@/storage/storage.constants';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn('increment')
  permissionsId: number;

  @Column({ nullable: false })
  userUUID: string;

  @Column({ nullable: false })
  driveId: string;

  @Column({ nullable: false, default: DEFAULT_FILE_NAME })
  name: string;

  @Column({ nullable: false })
  role: string;

  @Column({ nullable: false, default: false })
  isTrashed: boolean;

  @Column({ nullable: true, default: null })
  expireAt: Date;
}
