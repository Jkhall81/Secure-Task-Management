import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: false })
  completed: boolean;

  @Column({
    type: 'varchar',
    default: 'work',
  })
  category: string;

  @ManyToOne(() => User, (user) => user.id)
  owner: User;

  @ManyToOne(() => Organization, (org) => org.tasks)
  organization: Organization;
}
