import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  // Login method
  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          if (response && response.access_token) {
            this.setToken(response.access_token);
            // Also store user data if needed for UI
            if (response.user) {
              localStorage.setItem('user_data', JSON.stringify(response.user));
            }
          }
        })
      );
  }

  // Register method
  register(
    email: string,
    password: string,
    roleName: string,
    orgId: string
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, {
      email,
      password,
      roleName,
      orgId,
    });
  }

  // Store the JWT token
  setToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  }

  // Get the JWT token
  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  // Check if the user is authenticated (with expiration check)
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    return !this.isTokenExpired(token);
  }

  // Token expiration check (same logic as guard)
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  // Logout the user
  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
  }

  // Optional: Get user data for UI
  getUser(): any {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
}
