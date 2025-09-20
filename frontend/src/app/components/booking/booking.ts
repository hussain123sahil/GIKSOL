import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  hourlyRate: number;
  rating: number;
  profilePicture?: string;
}

interface BookingDetails {
  mentorId: string;
  preferredDate: string;
  preferredTime: string;
  sessionDuration: number;
  sessionType: string;
  notes: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.html',
  styleUrls: ['./booking.scss']
})
export class BookingComponent implements OnInit {
  mentor: Mentor | null = null;
  bookingDetails: BookingDetails = {
    mentorId: '',
    preferredDate: '',
    preferredTime: '',
    sessionDuration: 60,
    sessionType: 'video',
    notes: ''
  };
  isLoading = true;
  isSubmitting = false;
  bookingConfirmed = false;
  minDate: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Set minimum date to today
    this.minDate = new Date().toISOString().split('T')[0];
    
    const mentorId = this.route.snapshot.paramMap.get('mentorId');
    const queryParams = this.route.snapshot.queryParams;
    
    if (mentorId) {
      this.bookingDetails.mentorId = mentorId;
      
      // Pre-fill form with query parameters if available
      if (queryParams['preferredDate']) this.bookingDetails.preferredDate = queryParams['preferredDate'];
      if (queryParams['preferredTime']) this.bookingDetails.preferredTime = queryParams['preferredTime'];
      if (queryParams['sessionDuration']) this.bookingDetails.sessionDuration = parseInt(queryParams['sessionDuration']);
      if (queryParams['sessionType']) this.bookingDetails.sessionType = queryParams['sessionType'];
      if (queryParams['notes']) this.bookingDetails.notes = queryParams['notes'];
      
      this.loadMentorDetails(mentorId);
    }
  }

  loadMentorDetails(mentorId: string): void {
    // Mock data - replace with actual API call
    setTimeout(() => {
      this.mentor = {
        id: mentorId,
        firstName: 'John',
        lastName: 'Smith',
        company: 'Google',
        position: 'Senior Software Engineer',
        hourlyRate: 75,
        rating: 4.9
      };
      this.isLoading = false;
    }, 1000);
  }

  getTotalPrice(): number {
    return (this.bookingDetails.sessionDuration / 60) * (this.mentor?.hourlyRate || 0);
  }

  getSessionTypeText(): string {
    switch (this.bookingDetails.sessionType) {
      case 'video': return 'Video Call';
      case 'phone': return 'Phone Call';
      case 'chat': return 'Text Chat';
      default: return 'Video Call';
    }
  }

  submitBooking(): void {
    if (this.mentor && this.bookingDetails.preferredDate && this.bookingDetails.preferredTime) {
      this.isSubmitting = true;
      
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.bookingConfirmed = true;
        
        // In a real app, you would:
        // 1. Send booking request to backend
        // 2. Handle payment processing
        // 3. Send confirmation emails
        // 4. Redirect to dashboard or confirmation page
      }, 2000);
    }
  }

  goBack(): void {
    this.router.navigate(['/mentor-profile', this.bookingDetails.mentorId]);
  }

  goToDashboard(): void {
    this.router.navigate(['/student-dashboard']);
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
}
