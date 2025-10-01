import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../core/models/task.model';
import { CdkDropList, CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent {
  @Input() status!: string; // column name ("todo", "in-progress", "done")
  @Input() tasks: Task[] = []; // tasks come from Dashboard
  @Output() taskDropped = new EventEmitter<CdkDragDrop<Task[]>>();

  trackByTaskId(index: number, task: Task): string | number {
    return task.id;
  }

  // Forward the drop event up to the Dashboard
  drop(event: CdkDragDrop<Task[]>) {
    this.taskDropped.emit(event);
  }
}
