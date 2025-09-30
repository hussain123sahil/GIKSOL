import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface DayAvailability {
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

export interface AvailabilityData {
  [key: string]: DayAvailability;
}

export interface AvailabilityResponse {
  mentorId: string;
  availability: AvailabilityData;
  lastUpdated: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MentorAvailabilityService {
  private apiUrl = 'http://localhost:5000/api/mentor-availability';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAvailability(mentorId: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(`${this.apiUrl}/${mentorId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateAvailability(mentorId: string, availability: AvailabilityData): Observable<AvailabilityResponse> {
    return this.http.put<AvailabilityResponse>(`${this.apiUrl}/${mentorId}`, {
      availability
    }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getPublicAvailability(mentorId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/public/${mentorId}`);
  }
}

