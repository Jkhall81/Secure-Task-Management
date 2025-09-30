import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string; // e.g. CREATE_TASK, UPDATE_TASK, DELETE_TASK

  @Column({ nullable: true })
  targetId: number; // the ID of the task or resource being modified

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Organization, { eager: true })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;
}
