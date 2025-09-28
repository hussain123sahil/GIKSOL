import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth';
import { MentorSidebarComponent } from '../mentor-sidebar/mentor-sidebar';

interface Session {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  date: string;
  time: string;
  duration: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  sessionType: string;
  notes?: string;
  rating?: number;
  meetingLink?: string;
  title?: string;
}

@Component({
  selector: 'app-mentor-sessions',
  standalone: true,
  imports: [CommonModule, MentorSidebarComponent],
  templateUrl: './mentor-sessions.html',
  styleUrls: ['./mentor-sessions.scss']
})
export class MentorSessionsComponent implements OnInit {
  currentUser: User | null = null;
  upcomingSessions: Session[] = [];
  completedSessions: Session[] = [];
  activeTab: 'upcoming' | 'past' = 'upcoming';
  isLoading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    public router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading = true;
    this.error = null;

    const apiUrl = 'http://localhost:5000/api/sessions/mentor-dashboard';
    const mentorId = this.currentUser?.id;

    if (!mentorId) {
      this.error = 'Mentor ID not found';
      this.isLoading = false;
      return;
    }

    this.http.get(`${apiUrl}/${mentorId}`, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (response: any) => {
        this.upcomingSessions = response.upcomingSessions || [];
        this.completedSessions = response.completedSessions || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.error = error.error?.message || 'Failed to load sessions';
        this.isLoading = false;
      }
    });
  }

  setActiveTab(tab: 'upcoming' | 'past'): void {
    this.activeTab = tab;
  }

  refreshSessions(): void {
    this.loadSessions();
  }

  startSession(sessionId: string): void {
    console.log('Starting session:', sessionId);
    // Implement start session logic
  }

  rescheduleSession(sessionId: string): void {
    console.log('Rescheduling session:', sessionId);
    // Implement reschedule session logic
  }

  cancelSession(sessionId: string): void {
    if (confirm('Are you sure you want to cancel this session?')) {
      console.log('Cancelling session:', sessionId);
      // Implement cancel session logic
    }
  }

  viewSessionDetails(sessionId: string): void {
    console.log('Viewing session details:', sessionId);
    // Implement view session details logic
  }

  addSessionNotes(sessionId: string): void {
    console.log('Adding session notes:', sessionId);
    // Implement add session notes logic
  }

  getStars(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
}
