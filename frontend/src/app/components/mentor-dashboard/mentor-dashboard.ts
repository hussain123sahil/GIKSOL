import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth';

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

@Component({
  selector: 'app-mentor-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mentor-dashboard.html',
  styleUrls: ['./mentor-dashboard.scss']
})
export class MentorDashboardComponent implements OnInit {
  currentUser: User | null = null;
  mentees: Mentee[] = [];
  upcomingSessions: Session[] = [];
  completedSessions: Session[] = [];
  connectionRequests: ConnectionRequest[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private router: Router
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
    // Mock data - replace with actual API calls
    setTimeout(() => {
      this.mentees = [
        {
          id: '1',
          studentId: '1',
          studentName: 'Alice Johnson',
          studentEmail: 'alice@email.com',
          school: 'Stanford University',
          grade: 'Sophomore',
          learningGoals: ['React', 'JavaScript', 'Web Development'],
          joinedDate: '2024-01-10',
          totalSessions: 5,
          lastSessionDate: '2024-01-20'
        },
        {
          id: '2',
          studentId: '2',
          studentName: 'Bob Smith',
          studentEmail: 'bob@email.com',
          school: 'UC Berkeley',
          grade: 'Junior',
          learningGoals: ['Data Science', 'Python', 'Machine Learning'],
          joinedDate: '2024-01-15',
          totalSessions: 3,
          lastSessionDate: '2024-01-22'
        }
      ];

      this.upcomingSessions = [
        {
          id: '1',
          studentId: '1',
          studentName: 'Alice Johnson',
          date: '2024-01-25',
          time: '14:00',
          duration: 60,
          status: 'upcoming',
          sessionType: 'Video Call',
          notes: 'React hooks and state management'
        },
        {
          id: '2',
          studentId: '2',
          studentName: 'Bob Smith',
          date: '2024-01-28',
          time: '10:00',
          duration: 90,
          status: 'upcoming',
          sessionType: 'Video Call',
          notes: 'Data visualization with Python'
        }
      ];

      this.completedSessions = [
        {
          id: '3',
          studentId: '1',
          studentName: 'Alice Johnson',
          date: '2024-01-20',
          time: '15:00',
          duration: 60,
          status: 'completed',
          sessionType: 'Video Call',
          notes: 'JavaScript fundamentals',
          rating: 5
        }
      ];

      this.connectionRequests = [
        {
          id: '1',
          studentId: '3',
          studentName: 'Charlie Brown',
          studentEmail: 'charlie@email.com',
          school: 'MIT',
          requestMessage: 'I would love to learn about React and modern web development practices.',
          requestedAt: '2024-01-23',
          status: 'pending'
        }
      ];

      this.isLoading = false;
    }, 1000);
  }

  acceptRequest(requestId: string): void {
    // Implement accept request logic
    console.log('Accept request:', requestId);
  }

  rejectRequest(requestId: string): void {
    // Implement reject request logic
    console.log('Reject request:', requestId);
  }

  startSession(sessionId: string): void {
    // Implement start session logic
    console.log('Start session:', sessionId);
  }

  cancelSession(sessionId: string): void {
    // Implement cancel session logic
    console.log('Cancel session:', sessionId);
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
