import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const token = this.getToken();

    if (token && !this.isTokenExpired(token)) {
      return true;
    }

    // Token is missing or expired
    this.clearAuthData();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  private getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true; // If we can't parse, treat as expired
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
  }
}
