import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private tokenKey = 'jwt_token';
  private userKey = 'user_data';

  private authState = new BehaviorSubject<boolean>(this.isAuthenticated());
  authState$ = this.authState.asObservable();

  constructor(private http: HttpClient) {}

  // ---- AUTH ACTIONS ----

  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          if (response && response.access_token) {
            this.setToken(response.access_token);

            if (response.user) {
              localStorage.setItem(this.userKey, JSON.stringify(response.user));
            }

            this.authState.next(true);
          }
        })
      );
  }

  register(
    email: string,
    password: string,
    roleName: string | null,
    orgId?: string | null,
    orgName?: string | null
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, {
      email,
      password,
      roleName,
      orgId,
      orgName,
    });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.authState.next(false);
  }

  // ---- TOKEN HANDLING ----

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const expired = this.isTokenExpired(token);
    if (expired) {
      this.logout();
      return false;
    }
    return true;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // ms
      return Date.now() >= exp;
    } catch {
      return true; // invalid token
    }
  }

  // ---- USER HELPERS ----

  getUser(): any {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  getUserId(): number | null {
    return this.getUser()?.id ?? null;
  }

  getUserEmail(): string | null {
    return this.getUser()?.email ?? null;
  }

  // ---- NEW METHOD: Get current user from backend ----
  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        // Update local storage with fresh user data
        if (user) {
          localStorage.setItem(this.userKey, JSON.stringify(user));
        }
      })
    );
  }

  // ---- Optional: Refresh user data ----
  refreshUser(): void {
    this.getCurrentUser().subscribe({
      next: (user) => {
        console.log('User data refreshed:', user);
      },
      error: (err) => {
        console.error('Failed to refresh user data:', err);
      },
    });
  }

  // update orgs associated with user
  updateUserOrganization(orgId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/update-org`, { orgId });
  }
}
