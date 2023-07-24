import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn('increment')
  permissionsId: number;

  @Column({ nullable: false })
  userUUID: string;

  @Column({ nullable: false })
  driveId: string;

  @Column({ nullable: false, default: 'unnamed' })
  name: string;

  @Column({ nullable: false })
  role: string;

  @Column({ nullable: false, default: false })
  isTrashed: boolean;

  @Column({ nullable: true, default: null })
  expireAt: Date;
}
