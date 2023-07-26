import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  userUUID: string;

  @Column({ nullable: false })
  @Generated('uuid')
  sessionUUID: string;

  @Column({ nullable: false })
  expireAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
