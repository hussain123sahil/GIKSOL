import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth';
import { DashboardService, Session as DashboardSession } from '../../services/dashboard.service';
import { MentorSidebarComponent } from '../mentor-sidebar/mentor-sidebar';
import { CancelSessionModalComponent } from '../cancel-session-modal/cancel-session-modal';
import { AddNoteModalComponent } from '../add-note-modal/add-note-modal';
import { TimezoneService } from '../../services/timezone.service';
import { SessionStateService } from '../../services/session-state.service';
import { interval, Subscription } from 'rxjs';

// Use the Session interface from dashboard service
type Session = DashboardSession;

@Component({
  selector: 'app-mentor-sessions',
  standalone: true,
  imports: [CommonModule, MentorSidebarComponent, CancelSessionModalComponent, AddNoteModalComponent],
  templateUrl: './mentor-sessions.html',
  styleUrls: ['./mentor-sessions.scss']
})
export class MentorSessionsComponent implements OnInit, OnDestroy {
  @ViewChild(CancelSessionModalComponent) cancelModal!: CancelSessionModalComponent;
  @ViewChild(AddNoteModalComponent) noteModal!: AddNoteModalComponent;
  
  currentUser: User | null = null;
  upcomingSessions: Session[] = [];
  completedSessions: Session[] = [];
  activeTab: 'upcoming' | 'past' = 'upcoming';
  isLoading = true;
  error: string | null = null;
  showCancelModal = false;
  sessionToCancel: Session | null = null;
  isCancelling = false;
  
  // Add Note modal state
  showNoteModal = false;
  noteModalSession: Session | null = null;
  isSavingNote = false;
  
  // Timer for session availability
  private timerSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    public router: Router,
    private http: HttpClient,
    private dashboardService: DashboardService,
    private timezoneService: TimezoneService,
    private sessionStateService: SessionStateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadSessions();
    
    // Start timer for session availability updates
    this.timerSubscription = interval(30000).subscribe(() => {
      // Trigger change detection for session availability
    });
    
    // Listen for session updates from other components
    this.sessionStateService.getSessionUpdates().subscribe(update => {
      if (update) {
        this.handleSessionUpdate(update.action, update.session);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  // Handle session updates from other components
  handleSessionUpdate(action: string, session: Session): void {
    switch (action) {
      case 'start':
        // Update session status to in-progress
        this.upcomingSessions = this.upcomingSessions.map(s =>
          s.id === session.id ? { ...s, status: 'in-progress' } : s
        );
        break;
      case 'cancel':
        // Remove cancelled session from upcoming sessions
        this.upcomingSessions = this.upcomingSessions.filter(s => s.id !== session.id);
        break;
      case 'note-update':
        // Update session notes
        const target = this.upcomingSessions.find(s => s.id === session.id) ||
                       this.completedSessions.find(s => s.id === session.id);
        if (target) {
          target.notes = session.notes;
        }
        break;
    }
  }

  loadSessions(): void {
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
        this.upcomingSessions = response.upcomingSessions || [];
        this.completedSessions = response.completedSessions || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.error = error.error?.message || 'Failed to load sessions';
        this.isLoading = false;
      }
    });
  }

  setActiveTab(tab: 'upcoming' | 'past'): void {
    this.activeTab = tab;
  }

  refreshSessions(): void {
    this.loadSessions();
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
        const updatedSession = { ...session, status: 'in-progress' as const };
        this.upcomingSessions = this.upcomingSessions.map(s =>
          s.id === sessionId ? updatedSession : s
        );
        
        // Emit session update for synchronization
        this.sessionStateService.updateSession('start', updatedSession);
        
        // Open meeting link
        window.open(session.meetingLink as string, '_blank');
      },
      error: (error) => {
        console.error('Error starting session:', error);
        alert('Failed to start session. Please try again.');
      }
    });
  }

  canCancelSession(session: Session): boolean {
    const sessionDate = new Date(session.date);
    const now = new Date();
    
    // Mentors can cancel anytime before the scheduled session time
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
        
        // Create cancelled session object for synchronization
        const cancelledSession = { ...event.session, status: 'cancelled' as const };
        
        // Emit session update for synchronization
        this.sessionStateService.updateSession('cancel', cancelledSession);
        
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

  viewSessionDetails(sessionId: string): void {
    console.log('Viewing session details:', sessionId);
    // Implement view session details logic
  }

  addSessionNotes(sessionId: string): void {
    console.log('Adding session notes:', sessionId);
    // Implement add session notes logic
  }

  getStars(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Helper method to get student name
  getStudentName(session: Session): string {
    if (session.student?.firstName && session.student?.lastName) {
      return `${session.student.firstName} ${session.student.lastName}`;
    }
    return session.studentName || 'Unknown Student';
  }

  // Check if session can be started
  canStartSession(session: Session): boolean {
    const sessionDateTime = this.timezoneService.toIST(session.scheduledDate || session.date);
    const nowIST = this.timezoneService.getCurrentIST();
    
    // Can start 15 minutes before scheduled time
    const startTime = new Date(sessionDateTime.getTime() - 15 * 60 * 1000);
    
    return nowIST >= startTime && session.status === 'upcoming';
  }

  // Get time until session can be started
  getTimeUntilStartable(session: Session): string {
    const sessionDateTime = this.timezoneService.toIST(session.scheduledDate || session.date);
    const nowIST = this.timezoneService.getCurrentIST();
    const startTime = new Date(sessionDateTime.getTime() - 15 * 60 * 1000);
    
    if (nowIST >= startTime) {
      return 'now';
    }
    
    const diffMs = startTime.getTime() - nowIST.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  // Add note functionality
  addNote(session: Session): void {
    this.noteModalSession = session;
    this.showNoteModal = true;
  }

  onNoteModalCancel(): void {
    this.showNoteModal = false;
    this.noteModalSession = null;
  }

  onNoteModalSave(event: { sessionId: string; note: string }): void {
    this.isSavingNote = true;
    this.dashboardService.updateSessionNote(event.sessionId, event.note).subscribe({
      next: () => {
        // Update local model
        const target = this.upcomingSessions.find(s => s.id === event.sessionId) ||
                       this.completedSessions.find(s => s.id === event.sessionId);
        if (target) {
          target.notes = event.note;
          
          // Emit session update for synchronization
          this.sessionStateService.updateSession('note-update', target);
        }

        // Show success feedback on modal
        this.noteModal?.showSuccess();
      },
      error: (error) => {
        console.error('Failed to update note:', error);
        alert('Failed to update note. Please try again.');
        this.isSavingNote = false;
      },
      complete: () => {
        this.isSavingNote = false;
      }
    });
  }
}
