import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth';
import { SidebarComponent } from '../sidebar/sidebar';

interface Session {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorCompany: string;
  date: string;
  time: string;
  duration: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  sessionType: string;
  notes?: string;
  rating?: number;
}

interface Connection {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorCompany: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './student-dashboard.html',
  styleUrls: ['./student-dashboard.scss']
})
export class StudentDashboardComponent implements OnInit {
  currentUser: User | null = null;
  upcomingSessions: Session[] = [];
  completedSessions: Session[] = [];
  connections: Connection[] = [];
  isLoading = true;

  constructor(
    public router: Router,
    private authService: AuthService
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
    setTimeout(() => {
      this.upcomingSessions = [
        { id: '1', mentorId: '1', mentorName: 'John Smith', mentorCompany: 'Google', date: '2024-01-25', time: '14:00', duration: 60, status: 'upcoming', sessionType: 'Video Call', notes: 'Focus on React best practices' },
        { id: '2', mentorId: '2', mentorName: 'Sarah Johnson', mentorCompany: 'Microsoft', date: '2024-01-28', time: '10:00', duration: 90, status: 'upcoming', sessionType: 'Video Call', notes: 'Data science project review' }
      ];
      this.completedSessions = [
        { id: '3', mentorId: '1', mentorName: 'John Smith', mentorCompany: 'Google', date: '2024-01-15', time: '15:00', duration: 60, status: 'completed', sessionType: 'Video Call', notes: 'JavaScript fundamentals', rating: 5 }
      ];
      this.connections = [
        { id: '1', mentorId: '1', mentorName: 'John Smith', mentorCompany: 'Google', status: 'accepted', requestedAt: '2024-01-10', respondedAt: '2024-01-11' },
        { id: '2', mentorId: '2', mentorName: 'Sarah Johnson', mentorCompany: 'Microsoft', status: 'accepted', requestedAt: '2024-01-12', respondedAt: '2024-01-13' },
        { id: '3', mentorId: '3', mentorName: 'Mike Chen', mentorCompany: 'Amazon', status: 'pending', requestedAt: '2024-01-20' }
      ];
      this.isLoading = false;
    }, 500);
  }

  browseMentors(): void { this.router.navigate(['/mentors']); }
  viewSession(sessionId: string): void { console.log('View session:', sessionId); }
  cancelSession(sessionId: string): void { console.log('Cancel session:', sessionId); }
  rateSession(sessionId: string): void { console.log('Rate session:', sessionId); }
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
}
