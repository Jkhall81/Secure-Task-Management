import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { OrganizationService } from '../../../core/services/org.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  organizations: any[] = []; // list of orgs from backend

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private orgService: OrganizationService,
    private router: Router
  ) {
    this.registerForm = this.createForm();
  }

  ngOnInit() {
    // Load orgs for dropdown
    this.orgService.getPublicOrganizations().subscribe({
      next: (orgs) => (this.organizations = orgs),
      error: (err) => console.error('Failed to load orgs', err),
    });
  }

  private createForm(): FormGroup {
    return this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
        roleName: [''], // handle this dynamically
        orgId: [''], // optional → join org
        createOrg: [false], // toggle between join/create
        orgName: [''], // only required when createOrg = true
      },
      { validators: [this.passwordMatchValidator, this.orgValidator] }
    );
  }

  private orgValidator(g: FormGroup) {
    const createOrg = g.get('createOrg')?.value;
    const orgId = g.get('orgId')?.value;
    const orgName = g.get('orgName')?.value;

    if (!createOrg && !orgId) {
      return { orgRequired: true };
    }
    if (createOrg && !orgName) {
      return { orgNameRequired: true };
    }
    return null;
  }

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password, orgId, createOrg, orgName } =
        this.registerForm.value;

      const roleName = createOrg ? 'owner' : 'viewer';

      this.authService
        .register(
          email,
          password,
          roleName,
          createOrg ? null : orgId, // send orgId only if joining
          createOrg ? orgName : null // send orgName only if creating
        )
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/login'], {
              queryParams: { registered: true },
            });
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage =
              error.error?.message || 'Registration failed. Please try again.';
            console.error('Registration error:', error);
          },
        });
    } else {
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  // Convenience getters
  get email() {
    return this.registerForm.get('email');
  }
  get password() {
    return this.registerForm.get('password');
  }
  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
  get roleName() {
    return this.registerForm.get('roleName');
  }
  get orgId() {
    return this.registerForm.get('orgId');
  }
  get createOrg() {
    return this.registerForm.get('createOrg');
  }
  get orgName() {
    return this.registerForm.get('orgName');
  }
}
