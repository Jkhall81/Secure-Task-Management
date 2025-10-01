import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [CommonModule, RouterModule],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  isMobileMenuOpen = false;
  private authSub!: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authSub = this.authService.authState$.subscribe(
      (auth) => (this.isAuthenticated = auth)
    );
  }

  logout() {
    this.authService.logout(); // clears localStorage + emits false
    this.router.navigate(['/']); // go back to home
    this.isMobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }
}
