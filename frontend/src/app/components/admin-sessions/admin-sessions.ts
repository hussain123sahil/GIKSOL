import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth';
import { AdminService, Session } from '../../services/admin.service';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar';

@Component({
  selector: 'app-admin-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './admin-sessions.html',
  styleUrls: ['./admin-sessions.scss']
})
export class AdminSessionsComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  
  // Sessions data
  sessions: Session[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;
  
  // Search and filters
  searchTerm = '';
  statusFilter = 'all'; // 'all', 'scheduled', 'completed', 'cancelled'
  dateFilter = 'all'; // 'all', 'today', 'this-week', 'this-month'
  
  // Modal states
  showSessionModal = false;
  showDeleteModal = false;
  isEditing = false;
  selectedSession: Session | null = null;
  
  // Session form
  sessionForm = {
    title: '',
    description: '',
    scheduledDate: '',
    duration: 60,
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
    mentorId: '',
    studentId: '',
    meetingLink: '',
    notes: ''
  };

  // Available mentors and students for dropdowns
  mentors: any[] = [];
  students: any[] = [];

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadSessions();
    this.loadMentorsAndStudents();
  }

  loadSessions(): void {
    this.isLoading = true;
    console.log('📋 Loading sessions...');
    this.adminService.getSessions(this.currentPage, this.pageSize, this.statusFilter)
      .subscribe({
        next: (response) => {
          console.log('📋 Sessions loaded:', response);
          console.log('  - Number of sessions:', response.sessions?.length);
          console.log('  - First session ID:', response.sessions?.[0]?.id);
          console.log('  - First session type:', typeof response.sessions?.[0]?.id);
          
          this.sessions = response.sessions;
          this.totalItems = response.pagination.totalSessions || 0;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading sessions:', error);
          this.isLoading = false;
        }
      });
  }

  loadMentorsAndStudents(): void {
    // Load mentors
    this.adminService.getMentors(1, 100).subscribe({
      next: (response) => {
        this.mentors = response.mentors;
      },
      error: (error) => console.error('Error loading mentors:', error)
    });

    // Load students
    this.adminService.getStudents(1, 100).subscribe({
      next: (response) => {
        this.students = response.students;
      },
      error: (error) => console.error('Error loading students:', error)
    });
  }

  search(): void {
    this.currentPage = 1;
    this.loadSessions();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadSessions();
  }

  onDateFilterChange(): void {
    this.currentPage = 1;
    this.loadSessions();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSessions();
  }

  openSessionModal(session?: Session): void {
    this.isEditing = !!session;
    this.selectedSession = session || null;
    
    // Initialize form with default values
    this.sessionForm = {
      title: session?.title || '',
      description: session?.description || '',
      scheduledDate: session?.scheduledDate ? new Date(session.scheduledDate).toISOString().slice(0, 16) : '',
      duration: session?.duration || 60,
      status: session?.status || 'scheduled',
      mentorId: session?.mentor?.id || '',
      studentId: session?.student?.id || '',
      meetingLink: session?.meetingLink || '',
      notes: session?.notes || ''
    };
    
    this.showSessionModal = true;
  }

  closeSessionModal(): void {
    this.showSessionModal = false;
    this.selectedSession = null;
    this.isEditing = false;
  }

  saveSession(): void {
    if (!this.isFormValid()) return;

    const sessionData = {
      ...this.sessionForm,
      scheduledDate: new Date(this.sessionForm.scheduledDate).toISOString()
    };

    if (this.isEditing && this.selectedSession) {
      this.adminService.updateSession(this.selectedSession.id, sessionData)
        .subscribe({
          next: () => {
            this.closeSessionModal();
            this.loadSessions();
          },
          error: (error) => console.error('Error updating session:', error)
        });
    } else {
      this.adminService.createSession(sessionData)
        .subscribe({
          next: () => {
            this.closeSessionModal();
            this.loadSessions();
          },
          error: (error) => console.error('Error creating session:', error)
        });
    }
  }

  openDeleteModal(session: Session): void {
    console.log('🔍 Opening delete modal for session:', session);
    console.log('  - Session ID:', session.id);
    console.log('  - Session title:', session.title);
    console.log('  - Session type:', typeof session.id);
    
    this.selectedSession = session;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedSession = null;
  }

  deleteSession(): void {
    console.log('=== DELETE SESSION DEBUG ===');
    console.log('Selected session:', this.selectedSession);
    console.log('Selected session ID:', this.selectedSession?.id);
    console.log('Selected session type:', typeof this.selectedSession?.id);
    
    if (!this.selectedSession) {
      console.error('No session selected for deletion');
      return;
    }

    console.log('Calling adminService.deleteSession with ID:', this.selectedSession.id);
    this.adminService.deleteSession(this.selectedSession.id)
      .subscribe({
        next: (response) => {
          console.log('✅ Session deleted successfully:', response);
          this.closeDeleteModal();
          this.loadSessions();
        },
        error: (error) => {
          console.error('❌ Error deleting session:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error body:', error.error);
          console.error('Session ID was:', this.selectedSession?.id);
        }
      });
  }

  updateSessionStatus(session: Session, newStatus: 'scheduled' | 'completed' | 'cancelled'): void {
    this.adminService.updateSession(session.id, { status: newStatus })
      .subscribe({
        next: () => {
          this.loadSessions();
        },
        error: (error) => console.error('Error updating session status:', error)
      });
  }

  isFormValid(): boolean {
    return !!(this.sessionForm.title && this.sessionForm.mentorId && this.sessionForm.studentId && this.sessionForm.scheduledDate);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled': return '#007bff';
      case 'completed': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'scheduled': return '📅';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  getMentorName(mentor: any): string {
    return mentor ? `${mentor.firstName} ${mentor.lastName}` : 'Unknown Mentor';
  }

  getStudentName(student: any): string {
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
