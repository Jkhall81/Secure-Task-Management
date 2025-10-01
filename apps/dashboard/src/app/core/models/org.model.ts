import { User } from './user.model';
import { Task } from './task.model';

export interface Organization {
  id: number;
  name: string;
  parent?: Organization;
  children?: Organization[];
  users?: User[];
  tasks?: Task[];
}

export interface CreateOrganizationDto {
  name: string;
  parentId?: number;
}
