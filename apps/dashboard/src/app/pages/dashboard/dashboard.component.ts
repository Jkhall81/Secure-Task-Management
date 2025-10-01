import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import { TaskListComponent } from '../../features/tasks/task-list/task-list.component';
import { NewTaskComponent } from '../../features/tasks/new-task/new-task.component';
import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TaskListComponent,
    NewTaskComponent,
    CdkDropListGroup,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  // columns of tasks
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  showNewTask = false;
  refreshTrigger = 0;

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  /** Load tasks from backend and split by status */
  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.todoTasks = tasks.filter((t) => t.status === 'todo');
        this.inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
        this.doneTasks = tasks.filter((t) => t.status === 'done');
      },
      error: (err) => console.error('Failed to load tasks', err),
    });
  }

  /** Handle new task creation */
  handleTaskCreated() {
    this.loadTasks();
  }

  toggleNewTask() {
    this.showNewTask = !this.showNewTask;
  }

  /** Handle drag & drop between lists */
  onTaskDropped(event: CdkDragDrop<Task[]>, newStatus: string) {
    // Store the moved task for potential rollback
    const movedTask = { ...event.previousContainer.data[event.previousIndex] };

    if (event.previousContainer === event.container) {
      // Reordering within same column
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Move visually first for better UX
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update status in backend - use the provided newStatus parameter
      this.taskService
        .updateTask(movedTask.id, { status: newStatus })
        .subscribe({
          error: (err) => {
            console.error('Failed to update task status', err);
            // Rollback visually if update fails
            this.loadTasks();
          },
        });
    }
  }
}
