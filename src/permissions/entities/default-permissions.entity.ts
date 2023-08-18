import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('default_permissions')
export class DefaultPermissionsEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true, default: null })
  permissions?: number;
}
