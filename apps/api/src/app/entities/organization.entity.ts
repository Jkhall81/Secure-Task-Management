import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Self-referencing for hierarchy
  @ManyToOne(() => Organization, (org) => org.children, { nullable: true })
  parent: Organization;

  @OneToMany(() => Organization, (org) => org.parent)
  children: Organization[];

  // orgs can have many users
  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  // orgs can have many tasks
  @OneToMany(() => Task, (task) => task.organization)
  tasks: Task[];
}
