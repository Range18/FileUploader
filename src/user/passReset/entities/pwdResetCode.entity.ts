import { Column, Entity, Generated, PrimaryGeneratedColumn } from 'typeorm';
import { PwdResetCode } from './pwdResetCode.domainModel';

@Entity('PassResetCodes')
export class PwdResetCodeEntity implements PwdResetCode {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  userUUID: string;

  @Column({ nullable: false })
  @Generated('uuid')
  code: string;

  @Column({ nullable: false })
  expireIn: Date;
}
