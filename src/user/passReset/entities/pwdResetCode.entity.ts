import { Column, Entity, Generated, PrimaryGeneratedColumn } from 'typeorm';

@Entity('PassResetCodes')
export class PwdResetCodeEntity {
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
