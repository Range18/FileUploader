import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VerifyCode } from './verifyCode.domainModel';

@Entity('verifyCodes')
export class VerificationCodeEntity implements VerifyCode {
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
