import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, User } from '../../services/auth';
import { DashboardService, Session, DashboardData } from '../../services/dashboard.service';
import { SidebarComponent } from '../sidebar/sidebar';
import { CancelSessionModalComponent } from '../cancel-session-modal/cancel-session-modal';
import { TimezoneService } from '../../services/timezone.service';

@Component({
  selector: 'app-my-sessions',
  standalone: true,
  imports: [CommonModule, HttpClientModule, SidebarComponent, CancelSessionModalComponent],
  templateUrl: './my-sessions.html',
  styleUrls: ['./my-sessions.scss']
})
export class MySessionsComponent implements OnInit {
  @ViewChild(CancelSessionModalComponent) cancelModal!: CancelSessionModalComponent;
  
  currentUser: User | null = null;
  upcomingSessions: Session[] = [];
  isLoading = true;
  error: string | null = null;
  showCancelModal = false;
  sessionToCancel: Session | null = null;
  isCancelling = false;

  constructor(
    public router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private timezoneService: TimezoneService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('My Sessions - Current user:', this.currentUser);
    
    if (!this.currentUser) {
      console.log('No user found, using mock user for development');
      // For development, create a mock user instead of redirecting
      this.currentUser = {
        id: '68d2c326ac49758f6e269b4e',
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex.johnson@example.com',
        role: 'student'
      };
    }
    this.loadSessionsData();
  }

  loadSessionsData(): void {
    // For testing, use the seeded student ID
    const studentId = this.currentUser?.id || '68d2c326ac49758f6e269b4e';
    
    if (!studentId) {
      this.error = 'User not found';
      this.isLoading = false;
      return;
    }

    this.dashboardService.getDashboardData(studentId).subscribe({
      next: (data: DashboardData) => {
        // Only show upcoming sessions
        this.upcomingSessions = data.upcomingSessions;
        this.isLoading = false;
        this.error = null;
      },
      error: (error) => {
        console.error('Error loading sessions data:', error);
        console.log('Falling back to mock data for development');
        
        // Fallback to mock data for development
        this.loadMockData();
        this.error = null; // Clear error since we're using mock data
        this.isLoading = false;
      }
    });
  }

  private loadMockData(): void {
    this.upcomingSessions = [
      { 
        id: '1', 
        mentorId: '1', 
        mentorName: 'Jane Doe', 
        mentorCompany: 'Google', 
        date: '2024-03-15', 
        time: '10:00', 
        duration: 60, 
        status: 'scheduled', 
        sessionType: 'Career Guidance', 
        notes: 'Focus on career development and interview preparation',
        meetingLink: 'https://meet.google.com/abc-defg-hij'
      },
      { 
        id: '2', 
        mentorId: '2', 
        mentorName: 'John Smith', 
        mentorCompany: 'Microsoft', 
        date: '2024-03-18', 
        time: '14:00', 
        duration: 90, 
        status: 'scheduled', 
        sessionType: 'Technical Review', 
        notes: 'Code review session and system design discussion',
        meetingLink: 'https://meet.google.com/xyz-1234-567'
      },
      { 
        id: '3', 
        mentorId: '3', 
        mentorName: 'Emily Davis', 
        mentorCompany: 'Amazon', 
        date: '2024-03-20', 
        time: '16:00', 
        duration: 75, 
        status: 'scheduled', 
        sessionType: 'React Component Architecture', 
        notes: 'Learn about React component patterns and state management',
        meetingLink: 'https://meet.google.com/def-5678-901'
      }
    ];
  }

  // Navigation methods
  browseMentors(): void {
    this.router.navigate(['/mentors']);
  }

  viewAllSessions(): void {
    this.router.navigate(['/student-dashboard']);
  }

  // Session action methods
  joinSession(session: Session): void {
    if (session.meetingLink) {
      window.open(session.meetingLink, '_blank');
    }
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
    
    // Calculate 24 hours before session in IST
    const oneDayBefore = new Date(sessionDateIST.getTime() - (24 * 60 * 60 * 1000));
    
    // Students can only cancel if it's more than 24 hours before the session
    const canCancel = nowIST < oneDayBefore;
    
    console.log('Cancellation check (My Sessions):', {
      sessionDate: sessionDateIST.toLocaleString(),
      now: nowIST.toLocaleString(),
      oneDayBefore: oneDayBefore.toLocaleString(),
      canCancel,
      timeDifference: (sessionDateIST.getTime() - nowIST.getTime()) / (1000 * 60 * 60) // hours
    });
    
    return canCancel;
  }

  cancelSession(session: Session): void {
    if (!this.canCancelSession(session)) {
      alert('Sessions can only be cancelled at least 1 day before the scheduled date.');
      return;
    }

    this.sessionToCancel = session;
    this.showCancelModal = true;
  }

  onCancelModalConfirm(event: { session: any; reason: string }): void {
    this.isCancelling = true;
    
    // Use the dashboard service with proper authentication
    this.dashboardService.cancelSession(event.session.id, 'student', event.reason).subscribe({
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

  // Utility methods
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
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
      case 'scheduled': return '#1976d2';
      case 'upcoming': return '#1976d2';
      case 'completed': return '#2e7d32';
      case 'cancelled': return '#d32f2f';
      case 'pending': return '#f39c12';
      default: return '#666';
    }
  }

  getMentorAvatar(mentorName: string): string {
    // Return dummy profile images based on mentor name
    const avatarMap: { [key: string]: string } = {
      'Jane Doe': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      'John Smith': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      'Emily Davis': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      'David Brown': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      'Sarah Wilson': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    };
    return avatarMap[mentorName] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';
  }

  // Statistics methods
  getTotalSessionTime(): string {
    const totalMinutes = this.upcomingSessions.reduce((total, session) => total + session.duration, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  getUniqueMentors(): number {
    const uniqueMentors = new Set(this.upcomingSessions.map(session => session.mentorId));
    return uniqueMentors.size;
  }

  getNextSessionDate(): string {
    if (this.upcomingSessions.length === 0) return 'None';
    
    const sortedSessions = [...this.upcomingSessions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const nextSession = sortedSessions[0];
    return this.formatDate(nextSession.date);
  }
}
