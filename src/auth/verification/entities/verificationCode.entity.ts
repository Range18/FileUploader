import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('verifyCodes')
export class VerificationCodeEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  userUUID: string;

  @Column({ nullable: false })
  @Generated('uuid')
  code: string;

  @CreateDateColumn()
  createdAt: Date;
}
