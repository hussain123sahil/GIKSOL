import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
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
export class MentorDashboardComponent implements OnInit, OnDestroy {
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
    pendingRequests: 0,
    totalSessions: 0,
    averageRating: 0
  };
  isLoading = true;
  error: string | null = null;
  showCancelModal = false;
  sessionToCancel: Session | null = null;
  isCancelling = false;
  // Tracked clock in IST to allow time-based UI enablement
  nowIST: Date = new Date();
  private timeUpdateInterval: any;

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

    // Initialize current time
    this.nowIST = this.timezoneService.getCurrentIST();

    // Refresh current time periodically so the Start button enables at the right moment
    this.timeUpdateInterval = setInterval(() => {
      this.nowIST = this.timezoneService.getCurrentIST();
      // Check for sessions that need to be auto-completed
      this.checkAndAutoCompleteSessions();
    }, 30000); // update every 30s
  }

  ngOnDestroy(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
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

  /**
   * Determine if Start Session should be enabled.
   * Enabled when current time is within 10 minutes before the scheduled start (or later),
   * and the session is still in a startable state.
   */
  canStartSession(session: Session): boolean {
    // Must be a startable status
    const startableStatuses = ['scheduled', 'upcoming', 'in-progress'];
    if (!startableStatuses.includes(session.status)) {
      console.log('❌ Session not in startable status:', session.status);
      return false;
    }

    // Resolve scheduled datetime
    let scheduled: Date | null = null;
    if (session.scheduledDate) {
      scheduled = new Date(session.scheduledDate);
    } else if (session.date && session.time) {
      // Parse date and time more carefully
      const dateStr = session.date; // Should be in YYYY-MM-DD format
      const timeStr = session.time; // Should be in HH:MM format
      
      // Create a proper ISO string for the scheduled time
      const isoString = `${dateStr}T${timeStr}:00.000Z`;
      scheduled = new Date(isoString);
    }
    
    if (!scheduled || isNaN(scheduled.getTime())) {
      console.log('❌ Invalid scheduled date:', { sessionDate: session.date, sessionTime: session.time, scheduledDate: session.scheduledDate });
      return false;
    }

    const scheduledIST = this.timezoneService.toIST(scheduled!);
    const now = this.nowIST; // already IST

    // Enable if now >= scheduled - 10 minutes
    const tenMinutesMs = 10 * 60 * 1000;
    const canStart = now.getTime() >= (scheduledIST.getTime() - tenMinutesMs);
    
    // Debug logging
    console.log('🔍 Start Session Check:', {
      sessionId: session.id,
      sessionDate: session.date,
      sessionTime: session.time,
      scheduledDate: session.scheduledDate,
      scheduledIST: scheduledIST.toLocaleString(),
      nowIST: now.toLocaleString(),
      timeDiffMinutes: (scheduledIST.getTime() - now.getTime()) / (1000 * 60),
      tenMinutesBefore: new Date(scheduledIST.getTime() - (10 * 60 * 1000)).toLocaleString(),
      canStart,
      sessionStatus: session.status
    });
    
    return canStart;
  }

  /**
   * Get time remaining until session can be started (in minutes)
   */
  getTimeUntilStartable(session: Session): number {
    let scheduled: Date | null = null;
    if (session.scheduledDate) {
      scheduled = new Date(session.scheduledDate);
    } else if (session.date && session.time) {
      const dateStr = session.date;
      const timeStr = session.time;
      const isoString = `${dateStr}T${timeStr}:00.000Z`;
      scheduled = new Date(isoString);
    }
    
    if (!scheduled || isNaN(scheduled.getTime())) {
      return -1;
    }

    const scheduledIST = this.timezoneService.toIST(scheduled!);
    const now = this.nowIST;
    const tenMinutesMs = 10 * 60 * 1000;
    const timeUntilStartable = (scheduledIST.getTime() - tenMinutesMs) - now.getTime();
    
    return Math.ceil(timeUntilStartable / (1000 * 60)); // Return minutes
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

  /**
   * Check for in-progress sessions that should be auto-completed
   * Sessions are auto-completed 10 minutes after their scheduled end time
   */
  checkAndAutoCompleteSessions(): void {
    const now = this.nowIST;
    const tenMinutesMs = 10 * 60 * 1000;
    
    // Check all upcoming sessions for sessions that need completion
    this.upcomingSessions.forEach(session => {
      if (session.status === 'in-progress' || session.status === 'scheduled') {
        // Calculate session end time
        const sessionEndTime = this.getSessionEndTime(session);
        if (sessionEndTime) {
          const sessionEndTimeIST = this.timezoneService.toIST(sessionEndTime);
          const autoCompleteTime = new Date(sessionEndTimeIST.getTime() + tenMinutesMs);
          
          // If current time is past the auto-complete time, mark as completed
          if (now.getTime() >= autoCompleteTime.getTime()) {
            console.log('🔄 Auto-completing session:', session.id, 'at', now.toLocaleString());
            this.autoCompleteSession(session);
          }
        }
      }
    });
  }

  /**
   * Get the end time of a session based on its start time and duration
   */
  getSessionEndTime(session: Session): Date | null {
    let scheduled: Date | null = null;
    if (session.scheduledDate) {
      scheduled = new Date(session.scheduledDate);
    } else if (session.date && session.time) {
      const dateStr = session.date;
      const timeStr = session.time;
      const isoString = `${dateStr}T${timeStr}:00.000Z`;
      scheduled = new Date(isoString);
    }
    
    if (!scheduled || isNaN(scheduled.getTime())) {
      return null;
    }

    // Add duration to get end time
    const endTime = new Date(scheduled.getTime() + (session.duration * 60 * 1000));
    return endTime;
  }

  /**
   * Auto-complete a session by updating its status to completed
   */
  autoCompleteSession(session: Session): void {
    this.dashboardService.updateSessionStatus(session.id, 'completed').subscribe({
      next: (response) => {
        console.log('✅ Session auto-completed:', session.id);
        // Remove from upcoming sessions
        this.upcomingSessions = this.upcomingSessions.filter(s => s.id !== session.id);
        // Add to completed sessions
        this.completedSessions.unshift({ ...session, status: 'completed' });
        // Update quick stats
        this.quickStats.upcomingSessions = this.upcomingSessions.length;
        this.quickStats.completedSessions = this.completedSessions.length;
      },
      error: (error) => {
        console.error('❌ Failed to auto-complete session:', error);
      }
    });
  }


}
