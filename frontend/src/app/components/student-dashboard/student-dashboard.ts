import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, User } from '../../services/auth';
import { DashboardService, Session, Connection, DashboardData } from '../../services/dashboard.service';
import { SidebarComponent } from '../sidebar/sidebar';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, SidebarComponent],
  templateUrl: './student-dashboard.html',
  styleUrls: ['./student-dashboard.scss']
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  upcomingSessions: Session[] = [];
  completedSessions: Session[] = [];
  connections: Connection[] = [];
  quickStats = {
    upcomingSessions: 0,
    completedSessions: 0,
    totalConnections: 0,
    totalSessions: 0,
    averageRating: 0
  };
  isLoading = true;
  error: string | null = null;

  private navigationSubscription: any;

  constructor(
    public router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    // Get user from localStorage like the booking component does
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!this.currentUser || !this.currentUser.id) {
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
    this.loadDashboardData();

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
  }

  // Method to refresh dashboard data
  refreshDashboard(): void {
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
        console.log('📊 Dashboard data received:', data);
        console.log('📅 Upcoming sessions:', data.upcomingSessions);
        this.upcomingSessions = data.upcomingSessions;
        this.completedSessions = data.completedSessions;
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
      totalConnections: this.connections.length,
      totalSessions: this.upcomingSessions.length + this.completedSessions.length,
      averageRating: 4.5
    };
  }

  browseMentors(): void { this.router.navigate(['/mentors']); }
  viewSession(sessionId: string): void { console.log('View session:', sessionId); }
  cancelSession(sessionId: string): void { console.log('Cancel session:', sessionId); }
  rateSession(sessionId: string): void { console.log('Rate session:', sessionId); }
  viewAllSessions(): void { console.log('View all sessions'); }
  viewSessionDetails(sessionId: string): void { console.log('View session details:', sessionId); }
  logout(): void { this.authService.logout(); }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
