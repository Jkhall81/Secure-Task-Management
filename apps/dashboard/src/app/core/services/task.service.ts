import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = 'http://localhost:3000/api/tasks';

  constructor(private http: HttpClient) {}

  // Get all tasks
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  // Get tasks filtered by status
  getTasksByStatus(status: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}?status=${status}`);
  }

  // Create a new task
  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  // Update a task
  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  // Delete a task
  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
