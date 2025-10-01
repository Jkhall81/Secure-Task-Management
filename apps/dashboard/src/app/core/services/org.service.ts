import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organization } from '../models/org.model';
import { AuthService } from '../auth/auth.service'; // Import AuthService

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private apiUrl = 'http://localhost:3000/api/organizations';

  constructor(
    private http: HttpClient,
    private authService: AuthService // Inject AuthService
  ) {}

  // Helper method to get headers with JWT token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // Use this for the registration dropdown (public endpoint)
  getPublicOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.apiUrl}/public`);
  }

  // Existing secured endpoints (JWT required)
  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.apiUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  createOrganization(
    name: string,
    parentId?: number
  ): Observable<Organization> {
    return this.http.post<Organization>(
      this.apiUrl,
      { name, parentId },
      { headers: this.getAuthHeaders() }
    );
  }

  // Add this delete method
  deleteOrganization(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
