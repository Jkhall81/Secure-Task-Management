import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { Organization } from '../../../core/models/org.model';

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

  // Category options
  categories = [
    { value: 'work', label: 'Work', icon: '💼' },
    { value: 'personal', label: 'Personal', icon: '🏠' },
    { value: 'shopping', label: 'Shopping', icon: '🛒' },
    { value: 'health', label: 'Health', icon: '🏥' },
    { value: 'other', label: 'Other', icon: '📝' },
  ];

  @Input() currentOrg: Organization | null = null;
  @Output() taskCreated = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  constructor(private fb: FormBuilder, private taskService: TaskService) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      status: ['todo'],
      category: ['work'],
    });
  }

  // In new-task.component.ts - update the submit method
  submit() {
    if (this.taskForm.invalid) return;

    this.isSubmitting = true;

    const taskData = {
      ...this.taskForm.value,
      organizationId: this.currentOrg?.id,
    };

    console.log('=== TASK CREATION DEBUG ===');
    console.log('Form values:', this.taskForm.value);
    console.log('Category being sent:', this.taskForm.get('category')?.value);
    console.log('Full task data:', taskData);

    this.taskService.createTask(taskData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.taskForm.reset({
          status: 'todo',
          category: 'work',
        });
        this.taskCreated.emit();
        this.closed.emit();
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
