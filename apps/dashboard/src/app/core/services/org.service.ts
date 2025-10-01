import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organization } from '../models/org.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private apiUrl = 'http://localhost:3000/api/organizations';

  constructor(private http: HttpClient) {}

  // ✅ Use this for the registration dropdown (public endpoint)
  getPublicOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.apiUrl}/public`);
  }

  // 🔒 Existing secured endpoints (JWT required)
  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.apiUrl);
  }

  createOrganization(
    name: string,
    parentId?: number
  ): Observable<Organization> {
    return this.http.post<Organization>(this.apiUrl, { name, parentId });
  }
}
