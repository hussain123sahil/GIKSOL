import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Session {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorCompany: string;
  title?: string;
  date: string;
  time: string;
  scheduledDate?: string; // Add scheduledDate for cancellation logic
  duration: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'scheduled' | 'in-progress' | 'no-show';
  sessionType: string;
  notes?: string;
  rating?: number;
  meetingLink?: string;
  // User details for cancelled sessions
  student?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  mentor?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  // Cancellation details
  cancelledAt?: string;
  cancelledBy?: 'student' | 'mentor' | 'system';
  cancellationReason?: string;
  cancelledByName?: string;
}

export interface Connection {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorCompany: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
}

export interface QuickStats {
  upcomingSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalConnections: number;
  totalSessions: number;
  averageRating: number;
}

export interface DashboardData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  quickStats: QuickStats;
  upcomingSessions: Session[];
  completedSessions: Session[];
  cancelledSessions: Session[];
  connections: Connection[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getDashboardData(studentId: string): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/sessions/dashboard/${studentId}`);
  }

  createSession(sessionData: {
    studentId: string;
    mentorId: string;
    title: string;
    description?: string;
    sessionType?: string;
    scheduledDate: string;
    duration?: number;
    notes?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/sessions`, sessionData);
  }

  updateSessionStatus(sessionId: string, status: string, data?: {
    notes?: string;
    rating?: number;
    feedback?: string;
    cancelledBy?: string;
    cancellationReason?: string;
  }): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.apiUrl}/sessions/${sessionId}/status`, {
      status,
      ...data
    }, { headers });
  }

  getStudentSessions(studentId: string, status?: string, limit?: number, page?: number): Observable<any> {
    let params = '';
    if (status) params += `?status=${status}`;
    if (limit) params += `${params ? '&' : '?'}limit=${limit}`;
    if (page) params += `${params ? '&' : '?'}page=${page}`;
    
    return this.http.get(`${this.apiUrl}/sessions/student/${studentId}${params}`);
  }

  getSession(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sessions/${sessionId}`);
  }

  cancelSession(sessionId: string, cancelledBy: string, cancellationReason?: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.apiUrl}/sessions/${sessionId}/cancel`, {
      cancelledBy,
      cancellationReason: cancellationReason || 'No reason provided'
    }, { headers });
  }
}
