import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, User } from '../../services/auth';
import { DashboardService, Session, Connection, DashboardData } from '../../services/dashboard.service';
import { SidebarComponent } from '../sidebar/sidebar';
import { CancelSessionModalComponent } from '../cancel-session-modal/cancel-session-modal';
import { TimezoneService } from '../../services/timezone.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, SidebarComponent, CancelSessionModalComponent],
  templateUrl: './student-dashboard.html',
  styleUrls: ['./student-dashboard.scss']
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  @ViewChild(CancelSessionModalComponent) cancelModal!: CancelSessionModalComponent;
  
  currentUser: User | null = null;
  upcomingSessions: Session[] = [];
  completedSessions: Session[] = [];
  cancelledSessions: Session[] = [];
  connections: Connection[] = [];
  quickStats = {
    upcomingSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    totalConnections: 0,
    totalSessions: 0,
    averageRating: 0
  };
  isLoading = true;
  error: string | null = null;
  showCancelModal = false;
  sessionToCancel: Session | null = null;
  isCancelling = false;

  // Rating modal state
  showRateModal = false;
  sessionToRate: Session | null = null;
  currentRating = 0;
  hoverRating = 0;
  currentFeedback = '';
  isSubmittingRating = false;
  isUpdateRating = false;

  // Toast state
  showToast = false;
  toastMessage = '';

  // Tracked clock in IST to allow time-based UI enablement
  nowIST: Date = new Date();
  private timeUpdateInterval: any;

  private navigationSubscription: any;

  constructor(
    public router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private timezoneService: TimezoneService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    
    this.loadDashboardData();

    // Initialize IST time and set up periodic updates
    this.nowIST = this.timezoneService.getCurrentIST();
    this.timeUpdateInterval = setInterval(() => {
      this.nowIST = this.timezoneService.getCurrentIST();
    }, 30000); // update every 30s

    // Subscribe to navigation events to refresh data when returning to dashboard
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url === '/student-dashboard') {
          this.refreshDashboard();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  // Load user data from API
  loadUserData(): void {
    // First try to get user from localStorage for immediate display
    const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (cachedUser && cachedUser.id) {
      this.currentUser = cachedUser;
    }

    // Then fetch fresh user data from API
    this.authService.fetchCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        // Fallback to mock user for development
        if (!this.currentUser || !this.currentUser.id) {
          console.error('No user found and API failed. Please log in again.');
          this.currentUser = null;
        }
      }
    });
  }

  // Method to refresh dashboard data
  refreshDashboard(): void {
    this.loadUserData();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Use the actual logged-in user's ID
    const studentId = this.currentUser?.id;
    
    if (!studentId) {
      this.error = 'User not found';
      this.isLoading = false;
      return;
    }

    this.dashboardService.getDashboardData(studentId).subscribe({
      next: (data: DashboardData) => {
        this.upcomingSessions = data.upcomingSessions;
        this.completedSessions = data.completedSessions;
        this.cancelledSessions = data.cancelledSessions || [];
        this.connections = data.connections;
        this.quickStats = data.quickStats;
        this.isLoading = false;
        this.error = null;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
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
      { id: '1', mentorId: '1', mentorName: 'Jane Doe', mentorCompany: 'Google', date: '2024-03-15', time: '10:00', duration: 60, status: 'upcoming', sessionType: 'Career Guidance', notes: 'Focus on career development' },
      { id: '2', mentorId: '2', mentorName: 'John Smith', mentorCompany: 'Microsoft', date: '2024-03-15', time: '14:00', duration: 90, status: 'upcoming', sessionType: 'Technical Review', notes: 'Code review session' }
    ];
    this.completedSessions = [
      { id: '3', mentorId: '3', mentorName: 'Sarah Wilson', mentorCompany: 'Amazon', date: '2024-03-10', time: '15:00', duration: 60, status: 'completed', sessionType: 'Video Call', notes: 'JavaScript fundamentals', rating: 5 },
      { id: '4', mentorId: '4', mentorName: 'Mike Chen', mentorCompany: 'Meta', date: '2024-03-08', time: '11:00', duration: 45, status: 'completed', sessionType: 'Video Call', notes: 'React best practices', rating: 4 }
    ];
    this.cancelledSessions = [];
    this.connections = [
      { id: '1', mentorId: '1', mentorName: 'Jane Doe', mentorCompany: 'Google', status: 'accepted', requestedAt: '2024-01-10', respondedAt: '2024-01-11' },
      { id: '2', mentorId: '2', mentorName: 'John Smith', mentorCompany: 'Microsoft', status: 'accepted', requestedAt: '2024-01-12', respondedAt: '2024-01-13' },
      { id: '3', mentorId: '3', mentorName: 'Sarah Wilson', mentorCompany: 'Amazon', status: 'accepted', requestedAt: '2024-01-15', respondedAt: '2024-01-16' },
      { id: '4', mentorId: '4', mentorName: 'Mike Chen', mentorCompany: 'Meta', status: 'accepted', requestedAt: '2024-01-18', respondedAt: '2024-01-19' },
      { id: '5', mentorId: '5', mentorName: 'Alex Johnson', mentorCompany: 'Netflix', status: 'pending', requestedAt: '2024-01-20' }
    ];
    this.quickStats = {
      upcomingSessions: this.upcomingSessions.length,
      completedSessions: this.completedSessions.length,
      cancelledSessions: this.cancelledSessions.length,
      totalConnections: this.connections.length,
      totalSessions: this.upcomingSessions.length + this.completedSessions.length + this.cancelledSessions.length,
      averageRating: 4.5
    };
  }

  getCurrentTime(): string {
    return new Date().toLocaleString();
  }

  formatDate(dateString: string): string {
    return this.timezoneService.formatDateIST(new Date(dateString));
  }

  formatTime(timeString: string): string {
    // If it's already a formatted time string (HH:MM), convert to am/pm format
    if (timeString && timeString.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'pm' : 'am';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm} IST`;
    }
    // If it's a date string, format it using timezone service
    if (timeString && (timeString.includes('T') || timeString.includes('-'))) {
      return this.timezoneService.formatTimeIST(new Date(timeString));
    }
    // Fallback for other formats
    return timeString || 'Invalid Time';
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

  browseMentors(): void { this.router.navigate(['/book-session']); }
  viewSession(sessionId: string): void { 
    // Find the session by ID
    const session = this.upcomingSessions.find(s => s.id === sessionId);
    if (session && session.meetingLink) {
      // Open the meeting link in a new tab
      window.open(session.meetingLink, '_blank');
    } else {
      console.error('Session not found or no meeting link available');
      alert('Meeting link not available for this session');
    }
  }
  
  canCancelSession(session: Session): boolean {
    // Check if session is in a cancellable state
    if (!['scheduled', 'upcoming'].includes(session.status)) {
      return false;
    }

    // Get the session date - prioritize scheduledDate, fallback to date
    let sessionDateString = session.scheduledDate || session.date;
    
    if (!sessionDateString) {
      return false;
    }

    // If we have both date and time, combine them for proper parsing
    if (session.date && session.time) {
      const dateStr = session.date;
      const timeStr = session.time;
      const isoString = `${dateStr}T${timeStr}:00.000Z`;
      sessionDateString = isoString;
    }

    // Convert session date to IST for proper comparison
    const sessionDate = new Date(sessionDateString);
    if (isNaN(sessionDate.getTime())) {
      return false;
    }
    
    const sessionDateIST = this.timezoneService.toIST(sessionDate);
    
    // Get current time in IST
    const nowIST = this.nowIST;
    
    // Calculate 24 hours before session in IST
    const oneDayBefore = new Date(sessionDateIST.getTime() - (24 * 60 * 60 * 1000));
    
    // Students can only cancel if it's more than 24 hours before the session
    const canCancel = nowIST < oneDayBefore;
    
    console.log('Student cancellation check:', {
      sessionId: session.id,
      sessionDate: sessionDateIST.toLocaleString(),
      now: nowIST.toLocaleString(),
      oneDayBefore: oneDayBefore.toLocaleString(),
      canCancel,
      hoursUntilSession: (sessionDateIST.getTime() - nowIST.getTime()) / (1000 * 60 * 60),
      hoursUntil24HourLimit: (oneDayBefore.getTime() - nowIST.getTime()) / (1000 * 60 * 60)
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
    this.dashboardService.cancelSession(event.session.id, 'student', event.reason).subscribe({
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
  
  rateSession(session: Session): void {
    this.sessionToRate = session;
    this.currentRating = session.rating || 0;
    this.currentFeedback = '';
    this.hoverRating = 0;
    this.isUpdateRating = !!session.rating;
    this.showRateModal = true;
  }

  closeRateModal(): void {
    this.showRateModal = false;
    this.sessionToRate = null;
    this.currentRating = 0;
    this.currentFeedback = '';
    this.hoverRating = 0;
  }

  hideToast(): void {
    this.showToast = false;
  }

  setRating(value: number): void {
    this.currentRating = value;
  }

  submitRating(): void {
    if (!this.sessionToRate || this.currentRating === 0 || this.isSubmittingRating) return;
    this.isSubmittingRating = true;

    this.dashboardService.updateSessionStatus(this.sessionToRate.id, 'completed', {
      rating: this.currentRating,
      feedback: this.currentFeedback
    }).subscribe({
      next: (resp) => {
        // Update local completedSessions list
        const updated = resp.session;
        this.completedSessions = this.completedSessions.map(s => s.id === (updated._id || updated.id) ? { ...s, rating: this.currentRating } : s);
        // Also update in upcomingSessions if present there (defensive)
        this.upcomingSessions = this.upcomingSessions.map(s => s.id === (updated._id || updated.id) ? { ...s, rating: this.currentRating } : s);
        this.isSubmittingRating = false;
        this.closeRateModal();
        // Show success toast
        this.toastMessage = this.isUpdateRating ? 'Feedback updated successfully' : 'Feedback submitted successfully';
        this.showToast = true;
        setTimeout(() => this.showToast = false, 3000);
      },
      error: (error) => {
        console.error('Error submitting rating:', error);
        this.isSubmittingRating = false;
        alert(error.error?.message || 'Failed to submit rating. Please try again.');
      }
    });
  }
  viewAllSessions(): void { console.log('View all sessions'); }
  viewSessionDetails(sessionId: string): void { console.log('View session details:', sessionId); }
  logout(): void { this.authService.logout(); }

  getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return '#1976d2';
      case 'completed': return '#2e7d32';
      case 'cancelled': return '#d32f2f';
      case 'pending': return '#f39c12';
      case 'accepted': return '#2e7d32';
      case 'rejected': return '#d32f2f';
      default: return '#666';
    }
  }

  getMentorAvatar(mentorName: string): string {
    // Return dummy profile images based on mentor name
    const avatarMap: { [key: string]: string } = {
      'Jane Doe': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      'John Smith': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      'Sarah Wilson': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      'Mike Chen': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      'Alex Johnson': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    };
    return avatarMap[mentorName] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';
  }

  getPlaceholderCards(): any[] {
    // Return array of placeholder objects to fill empty slots in past sessions
    const totalSlots = 4;
    const usedSlots = this.completedSessions.length;
    const emptySlots = Math.max(0, totalSlots - usedSlots);
    return Array(emptySlots).fill({});
  }

  getStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    
    if (hasHalfStar) {
      stars.push('☆');
    }
    
    return stars;
  }
}
