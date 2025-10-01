import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import { TaskListComponent } from '../../features/tasks/task-list/task-list.component';
import { NewTaskComponent } from '../../features/tasks/new-task/new-task.component';
import { OrgSidebarComponent } from '../../features/organizations/org-sidebar.component';
import { Task } from '../../core/models/task.model';
import { Organization } from '../../core/models/org.model';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/auth/auth.service';
import { OrganizationService } from '../../core/services/org.service';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TaskListComponent,
    NewTaskComponent,
    OrgSidebarComponent,
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

  // Organization data
  currentOrg: Organization | null = null;
  organizations: Organization[] = [];
  orgSidebarOpen = false;

  showNewTask = false;
  refreshTrigger = 0;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private orgService: OrganizationService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadOrganizations();
  }

  /** Load current user and their organization */
  loadCurrentUser() {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Current user:', user); // Debug log
        this.currentOrg = user.organization;
        this.loadTasks();
      },
      error: (err) => {
        console.error('Failed to load user', err);
        // Fallback: try to get user from localStorage
        const cachedUser = this.authService.getUser();
        if (cachedUser && cachedUser.organization) {
          this.currentOrg = cachedUser.organization;
          this.loadTasks();
        }
      },
    });
  }

  /** Load organizations for the sidebar */
  loadOrganizations() {
    this.orgService.getOrganizations().subscribe({
      next: (orgs) => {
        console.log('Organizations loaded:', orgs);
        this.organizations = orgs;
      },
      error: (err) => {
        console.error('Failed to load organizations', err);
        // If we can't load all organizations, at least show the current one
        if (this.currentOrg) {
          this.organizations = [this.currentOrg];
        }
      },
    });
  }

  /** Load tasks from backend and split by status */
  loadTasks() {
    // Pass the current organization ID to the task service
    const orgId = this.currentOrg?.id;

    this.taskService.getTasks(orgId).subscribe({
      // ← ADD orgId HERE
      next: (tasks) => {
        console.log('ALL TASKS FROM API:', tasks);

        // Use tasks directly (backend already filtered them)
        const filteredTasks = tasks;

        // Debug each status filter
        this.todoTasks = filteredTasks.filter((t) => {
          const isTodo = t.status === 'todo';
          console.log(
            `Task "${t.title}" status: ${t.status} -> todo: ${isTodo}`
          );
          return isTodo;
        });

        this.inProgressTasks = filteredTasks.filter((t) => {
          const isInProgress = t.status === 'in-progress';
          console.log(
            `Task "${t.title}" status: ${t.status} -> in-progress: ${isInProgress}`
          );
          return isInProgress;
        });

        this.doneTasks = filteredTasks.filter((t) => {
          const isDone = t.status === 'done';
          console.log(
            `Task "${t.title}" status: ${t.status} -> done: ${isDone}`
          );
          return isDone;
        });

        console.log('FINAL COUNTS:');
        console.log('Todo:', this.todoTasks.length);
        console.log('In Progress:', this.inProgressTasks.length);
        console.log('Done:', this.doneTasks.length);
        console.log('Todo tasks:', this.todoTasks);
        console.log('In Progress tasks:', this.inProgressTasks);
        console.log('Done tasks:', this.doneTasks);
      },
      error: (err) => console.error('Failed to load tasks', err),
    });
  }

  /** Handle new task creation */
  handleTaskCreated() {
    this.loadTasks();
    this.showNewTask = false; // Close the new task form
  }

  toggleNewTask() {
    this.showNewTask = !this.showNewTask;
  }

  toggleOrgSidebar() {
    this.orgSidebarOpen = !this.orgSidebarOpen;
  }

  /** Handle organization selection */
  onOrgSelected(org: Organization) {
    this.currentOrg = org;
    this.loadTasks();
    this.orgSidebarOpen = false;
  }

  /** Handle new organization creation */
  onOrgCreated(org: Organization) {
    this.organizations.push(org);
    this.currentOrg = org;

    // Update user's organization in backend
    this.authService.updateUserOrganization(org.id).subscribe({
      next: () => {
        console.log('User organization updated to:', org.name);
        this.loadTasks();
      },
      error: (err) => {
        console.error('Failed to update user organization', err);
        // Still load tasks even if update fails
        this.loadTasks();
      },
    });
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
      // Fix the TypeScript error by asserting the status type
      this.taskService
        .updateTask(movedTask.id, {
          status: newStatus as 'todo' | 'in-progress' | 'done',
        })
        .subscribe({
          error: (err) => {
            console.error('Failed to update task status', err);
            // Rollback visually if update fails
            this.loadTasks();
          },
        });
    }
  }

  /** Handle task updates from inline editing */
  onTaskUpdated(updatedTask: Task) {
    // The task service already updated it in the backend
    // We just need to update our local state to reflect any changes
    console.log('Task updated:', updatedTask);

    // Optional: You can refresh the tasks to ensure consistency
    // or handle optimistic updates more precisely
    this.loadTasks();
  }

  onTaskDeleted(taskId: number) {
    console.log('Dashboard received delete event for task:', taskId);
    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        console.log('Task deleted successfully');
        this.loadTasks(); // Refresh the task list
      },
      error: (err) => {
        console.error('Failed to delete task', err);
      },
    });
  }
}
