import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Session {
  id: string;
  title?: string;
  mentorName?: string;
  mentorId?: string;
  mentorCompany?: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  sessionType: string;
  notes?: string;
  meetingLink?: string;
  [key: string]: any; // Allow additional properties
}

@Component({
  selector: 'app-cancel-session-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancel-session-modal.html',
  styleUrls: ['./cancel-session-modal.scss']
})
export class CancelSessionModalComponent {
  @Input() session: any = null;
  @Input() isLoading = false;
  @Output() confirm = new EventEmitter<{ session: any; reason: string }>();
  @Output() cancel = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  cancellationReason = '';
  showSuccessMessage = false;

  closeModal(): void {
    this.cancel.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  confirmCancellation(): void {
    if (this.session) {
      this.confirm.emit({
        session: this.session,
        reason: this.cancellationReason.trim()
      });
    }
  }

  showSuccess(): void {
    this.showSuccessMessage = true;
    this.isLoading = false;
  }

  closeSuccess(): void {
    this.showSuccessMessage = false;
    this.success.emit();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
}
