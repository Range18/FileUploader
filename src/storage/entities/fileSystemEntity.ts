import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DEFAULT_FILE_NAME } from '@/storage/storage.constants';

@Entity('files')
export class FileSystemEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  driveUUID: string;

  @Column({ nullable: false, default: DEFAULT_FILE_NAME })
  originalName: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  destination: string;

  @Column({ nullable: true, default: 'untyped' })
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
