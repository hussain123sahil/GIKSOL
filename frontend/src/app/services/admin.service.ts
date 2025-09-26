import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'mentor' | 'admin';
  profilePicture?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  user: string;
  learningGoals: string[];
  currentLevel: string;
  interests: string[];
  preferredLearningStyle: string;
  timeCommitment: string;
  budget: { min: number; max: number };
  bio: string;
}

export interface MentorProfile {
  id: string;
  user: string;
  company: string;
  position: string;
  expertise: string[];
  hourlyRate: number;
  bio: string;
  linkedinUrl: string;
  education: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  isAvailable: boolean;
  rating: number;
  totalSessions: number;
}

export interface Session {
  id: string;
  student: User;
  mentor: User;
  title: string;
  description: string;
  sessionType: string;
  scheduledDate: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  meetingLink?: string;
  rating?: number;
  studentFeedback?: string;
  mentorFeedback?: string;
  completedAt?: string;
}

export interface Connection {
  id: string;
  student: User;
  mentor: User;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  notes?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalMentors: number;
  totalAdmins: number;
  activeUsers: number;
  inactiveUsers: number;
  totalSessions: number;
  totalConnections: number;
  recentRegistrations: number;
  sessionsByStatus: Array<{ _id: string; count: number }>;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers?: number;
  totalStudents?: number;
  totalMentors?: number;
  totalSessions?: number;
  totalConnections?: number;
  hasNext: boolean;
  hasPrev: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:5000/api/admin';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  // Dashboard Statistics
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`, {
      headers: this.getHeaders()
    });
  }

  // Users Management
  getUsers(page: number = 1, limit: number = 10, search?: string, role?: string, status?: string): Observable<{ users: User[]; pagination: PaginationInfo }> {
    let params = `page=${page}&limit=${limit}`;
    if (search) params += `&search=${search}`;
    if (role && role !== 'all') params += `&role=${role}`;
    if (status && status !== 'all') params += `&status=${status}`;
    
    return this.http.get<{ users: User[]; pagination: PaginationInfo }>(`${this.apiUrl}/users?${params}`, {
      headers: this.getHeaders()
    });
  }

  getUserById(id: string): Observable<{ user: User; profile: StudentProfile | MentorProfile | null }> {
    return this.http.get<{ user: User; profile: StudentProfile | MentorProfile | null }>(`${this.apiUrl}/users/${id}`, {
      headers: this.getHeaders()
    });
  }

  createUser(userData: Partial<User>): Observable<{ message: string; user: User; profile: any }> {
    return this.http.post<{ message: string; user: User; profile: any }>(`${this.apiUrl}/users`, userData, {
      headers: this.getHeaders()
    });
  }

  updateUser(id: string, userData: Partial<User>): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/users/${id}`, userData, {
      headers: this.getHeaders()
    });
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Students Management
  getStudents(page: number = 1, limit: number = 10, search?: string): Observable<{ students: (User & { profile: StudentProfile })[]; pagination: PaginationInfo }> {
    let params = `page=${page}&limit=${limit}`;
    if (search) params += `&search=${search}`;
    
    return this.http.get<{ students: (User & { profile: StudentProfile })[]; pagination: PaginationInfo }>(`${this.apiUrl}/students?${params}`, {
      headers: this.getHeaders()
    });
  }

  updateStudentProfile(id: string, profileData: Partial<StudentProfile>): Observable<{ message: string; profile: StudentProfile }> {
    return this.http.put<{ message: string; profile: StudentProfile }>(`${this.apiUrl}/students/${id}/profile`, profileData, {
      headers: this.getHeaders()
    });
  }

  // Mentors Management
  getMentors(page: number = 1, limit: number = 10, search?: string): Observable<{ mentors: (User & { profile: MentorProfile })[]; pagination: PaginationInfo }> {
    let params = `page=${page}&limit=${limit}`;
    if (search) params += `&search=${search}`;
    
    return this.http.get<{ mentors: (User & { profile: MentorProfile })[]; pagination: PaginationInfo }>(`${this.apiUrl}/mentors?${params}`, {
      headers: this.getHeaders()
    });
  }

  updateMentorProfile(id: string, profileData: Partial<MentorProfile>): Observable<{ message: string; profile: MentorProfile }> {
    return this.http.put<{ message: string; profile: MentorProfile }>(`${this.apiUrl}/mentors/${id}/profile`, profileData, {
      headers: this.getHeaders()
    });
  }

  createMentor(mentorData: any): Observable<{ message: string; mentor: User }> {
    return this.http.post<{ message: string; mentor: User }>(`${this.apiUrl}/mentors`, mentorData, {
      headers: this.getHeaders()
    });
  }

  updateMentor(id: string, mentorData: any): Observable<{ message: string; mentor: User }> {
    return this.http.put<{ message: string; mentor: User }>(`${this.apiUrl}/mentors/${id}`, mentorData, {
      headers: this.getHeaders()
    });
  }

  deleteMentor(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/mentors/${id}`, {
      headers: this.getHeaders()
    });
  }


  // Sessions Management
  getSessions(page: number = 1, limit: number = 10, status?: string): Observable<{ sessions: Session[]; pagination: PaginationInfo }> {
    let params = `page=${page}&limit=${limit}`;
    if (status) params += `&status=${status}`;
    
    return this.http.get<{ sessions: Session[]; pagination: PaginationInfo }>(`${this.apiUrl}/sessions?${params}`, {
      headers: this.getHeaders()
    });
  }

  createSession(sessionData: any): Observable<{ message: string; session: Session }> {
    return this.http.post<{ message: string; session: Session }>(`${this.apiUrl}/sessions`, sessionData, {
      headers: this.getHeaders()
    });
  }

  updateSession(id: string, sessionData: any): Observable<{ message: string; session: Session }> {
    return this.http.put<{ message: string; session: Session }>(`${this.apiUrl}/sessions/${id}`, sessionData, {
      headers: this.getHeaders()
    });
  }

  deleteSession(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/sessions/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Connections Management
  getConnections(page: number = 1, limit: number = 10, status?: string): Observable<{ connections: Connection[]; pagination: PaginationInfo }> {
    let params = `page=${page}&limit=${limit}`;
    if (status) params += `&status=${status}`;
    
    return this.http.get<{ connections: Connection[]; pagination: PaginationInfo }>(`${this.apiUrl}/connections?${params}`, {
      headers: this.getHeaders()
    });
  }
}
