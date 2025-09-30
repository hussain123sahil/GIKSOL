import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth';
import { DashboardService } from '../../services/dashboard.service';
import { MentorSidebarComponent } from '../mentor-sidebar/mentor-sidebar';
import { CancelSessionModalComponent } from '../cancel-session-modal/cancel-session-modal';

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
  imports: [CommonModule, MentorSidebarComponent, CancelSessionModalComponent],
  templateUrl: './mentor-sessions.html',
  styleUrls: ['./mentor-sessions.scss']
})
export class MentorSessionsComponent implements OnInit {
  @ViewChild(CancelSessionModalComponent) cancelModal!: CancelSessionModalComponent;
  
  currentUser: User | null = null;
  upcomingSessions: Session[] = [];
  completedSessions: Session[] = [];
  activeTab: 'upcoming' | 'past' = 'upcoming';
  isLoading = true;
  error: string | null = null;
  showCancelModal = false;
  sessionToCancel: Session | null = null;
  isCancelling = false;

  constructor(
    private authService: AuthService,
    public router: Router,
    private http: HttpClient,
    private dashboardService: DashboardService
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

  canCancelSession(session: Session): boolean {
    const sessionDate = new Date(session.date);
    const now = new Date();
    
    // Mentors can cancel anytime before the scheduled session time
    return ['scheduled', 'upcoming'].includes(session.status) && now < sessionDate;
  }

  cancelSession(session: Session): void {
    if (!this.canCancelSession(session)) {
      alert('Sessions can only be cancelled before the scheduled time.');
      return;
    }

    this.sessionToCancel = session;
    this.showCancelModal = true;
  }

  onCancelModalConfirm(event: { session: any; reason: string }): void {
    this.isCancelling = true;
    this.dashboardService.cancelSession(event.session.id, 'mentor', event.reason).subscribe({
      next: (response) => {
        console.log('Session cancelled successfully:', response);
        // Remove the cancelled session from the list
        this.upcomingSessions = this.upcomingSessions.filter(s => s.id !== event.session.id);
        this.isCancelling = false;
        // Show success message in modal
        this.cancelModal.showSuccess();
      },
      error: (error) => {
        console.error('Error cancelling session:', error);
        const errorMessage = error.error?.message || 'Failed to cancel session. Please try again.';
        alert(errorMessage);
        this.isCancelling = false;
      }
    });
  }

  onCancelModalSuccess(): void {
    this.showCancelModal = false;
    this.sessionToCancel = null;
  }

  onCancelModalCancel(): void {
    this.showCancelModal = false;
    this.sessionToCancel = null;
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
