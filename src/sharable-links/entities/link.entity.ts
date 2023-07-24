import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class LinkEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  userShared: string;

  @Column({ nullable: false })
  destination: string;

  @Column({ nullable: false, default: 'unnamed' })
  name: string;

  @Column({ nullable: false })
  @Generated('uuid')
  link: string;

  @Column({ nullable: false })
  setRoles: string;

  @Column({ nullable: false, default: false })
  isPrivate: boolean;

  @Column({ default: null })
  usesLimit?: number;

  @Column({ default: null })
  permsExpireAt?: Date;

  @Column({ default: null })
  expireAt?: Date;

  @Column({ default: null })
  lastPass?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
