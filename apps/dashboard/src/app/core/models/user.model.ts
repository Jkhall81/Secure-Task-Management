import { Organization } from './org.model';

export interface User {
  id: number;
  email: string;
  role: Role;
  organization: Organization;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
}
