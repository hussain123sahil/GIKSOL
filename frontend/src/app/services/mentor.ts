import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Mentor {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  company: string;
  position: string;
  expertise: string[];
  hourlyRate: number;
  bio: string;
  linkedinUrl?: string;
  rating: number;
  totalSessions: number;
  isAvailable: boolean;
  availability?: any;
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education?: any[];
  certifications?: any[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MentorService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getAllMentors(): Observable<Mentor[]> {
    return this.http.get<Mentor[]>(`${this.apiUrl}/mentors`);
  }

  getMentorById(id: string): Observable<Mentor> {
    return this.http.get<Mentor>(`${this.apiUrl}/mentors/${id}`);
  }

  getMentorByUserId(userId: string): Observable<Mentor> {
    return this.http.get<Mentor>(`${this.apiUrl}/mentors/by-user/${userId}`);
  }

  searchMentors(params: {
    expertise?: string;
    search?: string;
    minRate?: number;
    maxRate?: number;
    available?: boolean;
  }): Observable<Mentor[]> {
    const queryParams = new URLSearchParams();
    
    if (params.expertise) queryParams.append('expertise', params.expertise);
    if (params.search) queryParams.append('search', params.search);
    if (params.minRate) queryParams.append('minRate', params.minRate.toString());
    if (params.maxRate) queryParams.append('maxRate', params.maxRate.toString());
    if (params.available !== undefined) queryParams.append('available', params.available.toString());

    return this.http.get<Mentor[]>(`${this.apiUrl}/mentors?${queryParams.toString()}`);
  }
}
