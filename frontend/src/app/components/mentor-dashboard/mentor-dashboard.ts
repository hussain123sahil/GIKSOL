import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth';
import { DashboardService, Session } from '../../services/dashboard.service';
import { MentorSidebarComponent } from '../mentor-sidebar/mentor-sidebar';
import { CancelSessionModalComponent } from '../cancel-session-modal/cancel-session-modal';
import { TimezoneService } from '../../services/timezone.service';

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
  cancelledSessions: number;
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
  cancelledSessions: Session[] = [];
  connectionRequests: ConnectionRequest[] = [];
  quickStats: QuickStats = {
    activeMentees: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
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
    private dashboardService: DashboardService,
    private timezoneService: TimezoneService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Add test cancelled sessions for testing
    this.cancelledSessions = [
      {
        id: 'test-mentor-1',
        mentorId: 'mentor-1',
        mentorName: 'Test Mentor',
        mentorCompany: 'Test Company',
        title: 'Test Cancelled Session (Mentor View)',
        date: '2024-12-19',
        time: '14:00',
        scheduledDate: '2024-12-19T14:00:00.000Z',
        duration: 60,
        status: 'cancelled',
        sessionType: 'Video Call',
        notes: 'This is a test cancelled session from mentor view',
        cancelledAt: '2024-12-18T10:00:00.000Z',
        cancelledBy: 'student',
        cancellationReason: 'Student had to cancel due to emergency',
        cancelledByName: 'Alex Johnson',
        student: {
          firstName: 'Alex',
          lastName: 'Johnson',
          email: 'alex.johnson@example.com'
        }
      }
    ];
    
    console.log('🎯 Mentor Dashboard - Added test cancelled sessions:', this.cancelledSessions);

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
        console.log('📊 Mentor Dashboard Response:', response);
        console.log('📊 Cancelled Sessions:', response.cancelledSessions);
        console.log('📊 Quick Stats:', response.quickStats);
        
        this.mentorInfo = response.mentor;
        this.quickStats = response.quickStats;
        this.upcomingSessions = response.upcomingSessions;
        this.completedSessions = response.completedSessions;
        this.cancelledSessions = response.cancelledSessions || [];
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
    const session = this.upcomingSessions.find(s => s.id === sessionId);
    if (!session) {
      console.error('Session not found');
      return;
    }

    if (!session.meetingLink) {
      alert('Meeting link not available for this session');
      return;
    }

    // Mark session as in-progress, then open the meeting link
    this.dashboardService.updateSessionStatus(sessionId, 'in-progress').subscribe({
      next: () => {
        // Optimistically update local state so UI reflects in-progress immediately
        this.upcomingSessions = this.upcomingSessions.map(s =>
          s.id === sessionId ? { ...s, status: 'in-progress' } : s
        );
        // Open meeting link
        window.open(session.meetingLink as string, '_blank');
      },
      error: (error) => {
        console.error('Failed to start session:', error);
        alert('Failed to start session. Please try again.');
      }
    });
  }

  canCancelSession(session: Session): boolean {
    // Check if session is in a cancellable state
    if (!['scheduled', 'upcoming'].includes(session.status)) {
      return false;
    }

    // Get the session date - it might be in 'date' or 'scheduledDate' property
    const sessionDateString = session.date || (session as any).scheduledDate;
    if (!sessionDateString) {
      return false;
    }

    // Convert session date to IST for proper comparison
    const sessionDate = new Date(sessionDateString);
    const sessionDateIST = this.timezoneService.toIST(sessionDate);
    
    // Get current time in IST
    const nowIST = this.timezoneService.getCurrentIST();
    
    // Mentors can cancel anytime before the session starts
    const canCancel = nowIST < sessionDateIST;
    
    console.log('Mentor cancellation check:', {
      sessionDate: sessionDateIST.toLocaleString(),
      now: nowIST.toLocaleString(),
      canCancel,
      timeDifference: (sessionDateIST.getTime() - nowIST.getTime()) / (1000 * 60 * 60) // hours
    });
    
    return canCancel;
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

  getCancelledByTag(session: Session): string {
    if (session.cancelledBy === 'student') {
      return `👨‍🎓 Cancelled by ${session.cancelledByName || 'Student'}`;
    } else if (session.cancelledBy === 'mentor') {
      return `👨‍🏫 Cancelled by ${session.cancelledByName || 'Mentor'}`;
    }
    return `🤖 Cancelled by System`;
  }

  getCancelledByClass(session: Session): string {
    if (session.cancelledBy === 'student') {
      return 'tag-student-cancel';
    } else if (session.cancelledBy === 'mentor') {
      return 'tag-mentor-cancel';
    }
    return 'tag-system-cancel';
  }
}
