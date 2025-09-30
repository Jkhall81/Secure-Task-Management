import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
        roleName: ['admin', [Validators.required]],
        orgId: ['1', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      g.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password, roleName, orgId } = this.registerForm.value;

      this.authService.register(email, password, roleName, orgId).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Registration successful:', response);
          // Redirect to login page after successful registration
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
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  // Convenience getters for easy access in template
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
}
