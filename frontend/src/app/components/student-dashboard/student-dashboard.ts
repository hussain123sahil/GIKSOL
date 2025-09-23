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
}
