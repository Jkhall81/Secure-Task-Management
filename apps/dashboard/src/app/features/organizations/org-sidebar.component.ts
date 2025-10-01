import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Organization } from '../../core/models/org.model';
import { OrganizationService } from '../../core/services/org.service';

@Component({
  selector: 'app-org-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './org-sidebar.component.html',
  styleUrls: ['./org-sidebar.component.css'],
})
export class OrgSidebarComponent {
  @Input() currentOrg: Organization | null = null;
  @Input() organizations: Organization[] = [];
  @Output() orgSelected = new EventEmitter<Organization>();
  @Output() orgCreated = new EventEmitter<Organization>();
  @Output() orgDeleted = new EventEmitter<number>();
  @Output() sidebarClosed = new EventEmitter<void>();

  showCreateOrgModal = false;
  newOrgName = '';
  selectedParentId?: number;
  isLoading = false;

  constructor(private orgService: OrganizationService) {}

  // Close sidebar
  closeSidebar() {
    this.sidebarClosed.emit();
  }

  // Select organization
  selectOrg(org: Organization) {
    this.orgSelected.emit(org);
  }

  // Open create org modal
  openCreateOrgModal() {
    this.showCreateOrgModal = true;
    this.newOrgName = '';
    this.selectedParentId = undefined;
  }

  // Close create org modal
  closeCreateOrgModal() {
    this.showCreateOrgModal = false;
  }

  // Create new organization
  createOrganization() {
    if (!this.newOrgName.trim()) return;

    this.isLoading = true;

    // Pass parameters separately instead of as an object
    this.orgService
      .createOrganization(this.newOrgName.trim(), this.selectedParentId)
      .subscribe({
        next: (newOrg) => {
          this.orgCreated.emit(newOrg);
          this.closeCreateOrgModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to create organization:', error);
          this.isLoading = false;
        },
      });
  }

  // Helper to get top-level organizations (no parent)
  get parentOrganizations(): Organization[] {
    return this.organizations.filter((org) => !org.parent);
  }

  // Helper to get child organizations for a parent
  getChildOrgs(parentId: number): Organization[] {
    return this.organizations.filter((org) => org.parent?.id === parentId);
  }

  // Check if organization has children
  hasChildren(orgId: number): boolean {
    return this.organizations.some((org) => org.parent?.id === orgId);
  }
  showDeleteModal = false;
  orgToDelete: Organization | null = null;

  onDeleteOrg(org: Organization, event: Event) {
    event.stopPropagation(); // Prevent org selection when clicking delete
    this.orgToDelete = org;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.orgToDelete) {
      this.orgService.deleteOrganization(this.orgToDelete.id).subscribe({
        next: () => {
          console.log('Organization deleted successfully');
          this.orgDeleted.emit(this.orgToDelete!.id);
          this.showDeleteModal = false;
          this.orgToDelete = null;
        },
        error: (err) => {
          console.error('Failed to delete organization', err);
          this.showDeleteModal = false;
          this.orgToDelete = null;
        },
      });
    }
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.orgToDelete = null;
  }
}
