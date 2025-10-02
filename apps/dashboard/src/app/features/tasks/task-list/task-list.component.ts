import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../../core/models/task.model';
import { CdkDropList, CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskService } from '../../../core/services/task.service';
import { ConfirmationModalComponent } from './confirmation-modal.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CdkDropList,
    CdkDrag,
    ConfirmationModalComponent,
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent implements OnChanges {
  @Input() status!: string; // column name ("todo", "in-progress", "done")
  @Input() tasks: Task[] = []; // tasks come from Dashboard
  @Output() taskDropped = new EventEmitter<CdkDragDrop<Task[]>>();
  @Output() taskUpdated = new EventEmitter<Task>(); // to notify parent
  @Output() taskDeleted = new EventEmitter<number>();
  @Input() searchQuery: string = '';
  @Input() selectedCategory: string = 'all';

  private originalTaskState: { [key: number]: Partial<Task> } = {};

  constructor(private taskService: TaskService) {}

  trackByTaskId(index: number, task: Task): string | number {
    return task.id;
  }

  get filteredTasks(): Task[] {
    return this.tasks.filter((task) => {
      const searchLower = this.searchQuery.toLowerCase();
      const titleMatch =
        task.title?.toLowerCase().includes(searchLower) ?? false;
      const descriptionMatch =
        task.description?.toLowerCase().includes(searchLower) ?? false;

      const matchesSearch =
        this.searchQuery === '' || titleMatch || descriptionMatch;
      const matchesCategory =
        this.selectedCategory === 'all' ||
        task.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  // Forward the drop event up to the Dashboard
  drop(event: CdkDragDrop<Task[]>) {
    this.taskDropped.emit(event);
  }

  showDeleteModal = false;
  taskToDelete: number | null = null;

  onDelete(taskId: number) {
    console.log('Delete button clicked for task ID:', taskId);
    this.taskToDelete = taskId;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.taskToDelete) {
      console.log('Confirmed deletion for task:', this.taskToDelete);
      this.taskDeleted.emit(this.taskToDelete);
      this.showDeleteModal = false;
      this.taskToDelete = null;
    }
  }

  cancelDelete() {
    console.log('Deletion cancelled');
    this.showDeleteModal = false;
    this.taskToDelete = null;
  }

  getParentOrgName(task: any): string {
    return task.organization?.parent?.name || 'Parent Organization';
  }

  getChildOrgTooltip(task: any): string {
    if (task.organization?.parent) {
      return `From: ${this.getParentOrgName(task)} → ${task.organization.name}`;
    }
    return '';
  }

  enableEditing(task: Task): void {
    // Save original state in case of cancel
    this.originalTaskState[task.id] = {
      title: task.title,
      description: task.description,
    };

    task.editing = true;

    // Focus the title input after a brief delay to ensure it's rendered
    setTimeout(() => {
      const titleInput = document.querySelector(
        `[data-task-id="${task.id}"] input`
      ) as HTMLInputElement;
      if (titleInput) {
        titleInput.focus();
        titleInput.select();
      }
    }, 0);
  }

  saveTask(task: Task): void {
    task.editing = false;

    // Remove the original state
    delete this.originalTaskState[task.id];

    // Update the task via service and emit to parent
    this.taskService
      .updateTask(task.id, {
        title: task.title,
        description: task.description,
      })
      .subscribe({
        next: (updatedTask) => {
          // Update local task with server response
          Object.assign(task, updatedTask);
          // Notify parent component about the update
          this.taskUpdated.emit(updatedTask);
        },
        error: (error) => {
          console.error('Failed to update task:', error);
          // Optionally revert the changes or show an error message
        },
      });
  }

  cancelEditing(task: Task): void {
    // Restore original values
    const original = this.originalTaskState[task.id];
    if (original) {
      task.title = original.title || '';
      task.description = original.description || '';
      delete this.originalTaskState[task.id];
    }

    task.editing = false;
  }

  // In your TaskListComponent, add this:
  ngOnChanges() {
    console.log('Tasks received in task-list:', this.tasks);
    if (this.tasks.length > 0) {
      this.tasks.forEach((task, index) => {
        console.log(`Task ${index}:`, task.title);
        console.log('  Organization:', task.organization);
        console.log('  Has parent org?:', task.organization?.parent);
      });
    }
  }
}
