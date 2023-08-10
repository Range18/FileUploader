import { DEFAULT_FILE_NAME } from '@/storage/storage.constants';
import { UserEntity } from '@/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('files')
export class FileSystemEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.files, {
    nullable: false,
  })
  @JoinColumn({ name: 'driveUUID' })
  owner: UserEntity;

  @Column({ nullable: false, default: DEFAULT_FILE_NAME })
  originalName: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  destination: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: false })
  size: number;

  @Column({ nullable: false, default: false })
  isTrashed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
