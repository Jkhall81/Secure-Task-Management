import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-new-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.css'],
})
export class NewTaskComponent {
  taskForm: FormGroup;
  isSubmitting = false;

  @Output() taskCreated = new EventEmitter<void>(); // notify parent to reload lists
  @Output() closed = new EventEmitter<void>(); // notify parent to close modal/form

  constructor(private fb: FormBuilder, private taskService: TaskService) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      status: ['todo'], // default new tasks to "todo"
    });
  }

  submit() {
    if (this.taskForm.invalid) return;

    this.isSubmitting = true;
    this.taskService.createTask(this.taskForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.taskForm.reset({ status: 'todo' });
        this.taskCreated.emit(); // let dashboard reload tasks
        this.closed.emit(); // auto-close form after submit
      },
      error: (err) => {
        console.error('Failed to create task', err);
        this.isSubmitting = false;
      },
    });
  }

  cancel() {
    this.closed.emit();
  }
}
