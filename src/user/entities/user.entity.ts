import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FileSystemEntity } from '@/storage/entities/fileSystemEntity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  UUID: string;

  @Column({ nullable: false, unique: true })
  username: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false, default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => FileSystemEntity,
    (fileSystemEntity) => fileSystemEntity.owner,
    { nullable: true },
  )
  files?: FileSystemEntity[];
}
