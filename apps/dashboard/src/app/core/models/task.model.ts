export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string; // todo | in-progress | done
  createdAt?: string;
  updatedAt?: string;
}
