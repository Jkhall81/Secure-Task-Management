import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [CommonModule, RouterModule],
})
export class NavbarComponent {
  isAuthenticated: boolean = false;
  isMobileMenuOpen = false;

  constructor(private router: Router) {
    // Check if there's a JWT token to verify authentication
    const token = localStorage.getItem('jwt_token');
    if (token) {
      this.isAuthenticated = true;
    }
  }

  // Method to handle logout
  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    this.isAuthenticated = false;
    this.isMobileMenuOpen = false;
    this.router.navigate(['/']);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
