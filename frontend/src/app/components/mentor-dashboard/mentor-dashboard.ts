import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth';
import { DashboardService } from '../../services/dashboard.service';
import { MentorSidebarComponent } from '../mentor-sidebar/mentor-sidebar';
import { CancelSessionModalComponent } from '../cancel-session-modal/cancel-session-modal';

interface Mentee {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  school: string;
  grade: string;
  learningGoals: string[];
  joinedDate: string;
  totalSessions: number;
  lastSessionDate?: string;
}

interface Session {
  id: string;
  studentId: string;
  studentName: string;
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

interface ConnectionRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  school: string;
  requestMessage: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface QuickStats {
  activeMentees: number;
  upcomingSessions: number;
  completedSessions: number;
  pendingRequests: number;
  totalSessions: number;
  averageRating: number;
}

interface MentorInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  company: string;
  position: string;
  expertise: string[];
  rating: number;
  totalSessions: number;
}

@Component({
  selector: 'app-mentor-dashboard',
  standalone: true,
  imports: [CommonModule, MentorSidebarComponent, CancelSessionModalComponent],
  templateUrl: './mentor-dashboard.html',
  styleUrls: ['./mentor-dashboard.scss']
})
export class MentorDashboardComponent implements OnInit {
  @ViewChild(CancelSessionModalComponent) cancelModal!: CancelSessionModalComponent;
  
  currentUser: User | null = null;
  mentorInfo: MentorInfo | null = null;
  mentees: Mentee[] = [];
  upcomingSessions: Session[] = [];
  completedSessions: Session[] = [];
  connectionRequests: ConnectionRequest[] = [];
  quickStats: QuickStats = {
    activeMentees: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    pendingRequests: 0,
    totalSessions: 0,
    averageRating: 0
  };
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

    this.loadDashboardData();
  }

  loadDashboardData(): void {
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
        console.log('Mentor dashboard response:', response);
        console.log('Mentees data:', response.mentees);
        this.mentorInfo = response.mentor;
        this.quickStats = response.quickStats;
        this.upcomingSessions = response.upcomingSessions;
        this.completedSessions = response.completedSessions;
        this.mentees = response.mentees || [];
        this.connectionRequests = response.connectionRequests;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading mentor dashboard:', error);
        this.error = error.error?.message || 'Failed to load dashboard data';
        this.isLoading = false;
      }
    });
  }

  acceptRequest(requestId: string): void {
    this.http.put(`http://localhost:5000/api/connections/${requestId}/respond`, {
      status: 'accepted'
    }, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        console.log('Request accepted:', response);
        this.loadDashboardData(); // Refresh data
      },
      error: (error) => {
        console.error('Error accepting request:', error);
      }
    });
  }

  rejectRequest(requestId: string): void {
    this.http.put(`http://localhost:5000/api/connections/${requestId}/respond`, {
      status: 'rejected'
    }, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        console.log('Request rejected:', response);
        this.loadDashboardData(); // Refresh data
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
      }
    });
  }

  startSession(sessionId: string): void {
    // Implement start session logic
    console.log('Start session:', sessionId);
    // Navigate to session or open meeting link
  }

  canCancelSession(session: Session): boolean {
    const sessionDate = new Date(session.date);
    const now = new Date();
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
        // Update quick stats
        this.quickStats.upcomingSessions = this.upcomingSessions.length;
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
    // Implement view session details logic
    console.log('View session details:', sessionId);
  }

  getStars(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars;
  }

  logout(): void {
    this.authService.logout();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return '#1976d2';
      case 'completed': return '#2e7d32';
      case 'cancelled': return '#d32f2f';
      case 'pending': return '#f39c12';
      default: return '#666';
    }
  }
}
