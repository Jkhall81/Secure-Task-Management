import { Organization } from './org.model';
import { User } from './user.model';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  completed: boolean;
  category: 'work' | 'personal' | 'shopping' | 'health' | 'other';
  owner: User;
  organization: Organization;
  createdAt?: Date;
  editing?: boolean;
}
