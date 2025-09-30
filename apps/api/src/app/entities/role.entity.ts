import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Permission } from './permission.entity';
import { User } from './user.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // 'owner', 'admin', 'viewer'

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable()
  permissions: Permission[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
