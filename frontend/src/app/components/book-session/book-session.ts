import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar';

interface Mentor {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  company: string;
  position: string;
  expertise: string[];
  hourlyRate: number;
  bio: string;
  rating: number;
  totalSessions: number;
  availability: {
    [key: string]: {
      start: string;
      end: string;
      available: boolean;
    };
  };
}

interface SearchFilters {
  preferredDate: string;
  preferredTime: string;
  sessionDuration: number;
}

@Component({
  selector: 'app-book-session',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, SidebarComponent],
  templateUrl: './book-session.html',
  styleUrls: ['./book-session.scss']
})
export class BookSessionComponent implements OnInit {
  filters: SearchFilters = {
    preferredDate: '',
    preferredTime: '',
    sessionDuration: 60
  };
  
  availableMentors: Mentor[] = [];
  isSearching = false;
  hasSearched = false;
  minDate: string = '';

  constructor(
    public router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('BookSessionComponent initialized');
    try {
      // Set minimum date to today
      this.minDate = new Date().toISOString().split('T')[0];
      
      // Set default date to today
      this.filters.preferredDate = this.minDate;
      console.log('BookSessionComponent setup completed successfully');
    } catch (error) {
      console.error('Error in BookSessionComponent ngOnInit:', error);
    }
  }

  onDateChange(): void {
    // Reset time when date changes
    this.filters.preferredTime = '';
    this.hasSearched = false;
  }

  onTimeChange(): void {
    // Auto-search when both date and time are selected
    if (this.filters.preferredDate && this.filters.preferredTime) {
      this.searchMentors();
    }
  }

  onDurationChange(): void {
    // Re-search if we already have results
    if (this.hasSearched && this.filters.preferredDate && this.filters.preferredTime) {
      this.searchMentors();
    }
  }

  searchMentors(): void {
    if (!this.filters.preferredDate || !this.filters.preferredTime) {
      return;
    }

    this.isSearching = true;
    this.hasSearched = true;

    const params = {
      date: this.filters.preferredDate,
      time: this.filters.preferredTime,
      duration: this.filters.sessionDuration.toString()
    };

    this.http.get<Mentor[]>('http://localhost:3000/api/mentors/available', { params })
      .subscribe({
        next: (mentors) => {
          console.log('Mentors found:', mentors);
          this.availableMentors = mentors;
          this.isSearching = false;
        },
        error: (error) => {
          console.error('Error searching mentors:', error);
          this.availableMentors = [];
          this.isSearching = false;
          // Don't redirect on error, just show empty state
        }
      });
  }

  bookSession(mentor: Mentor): void {
    // Navigate to the booking page with mentor ID and pre-filled details
    const queryParams = {
      preferredDate: this.filters.preferredDate,
      preferredTime: this.filters.preferredTime,
      sessionDuration: this.filters.sessionDuration.toString(),
      sessionType: 'video',
      notes: ''
    };

    this.router.navigate(['/booking', mentor._id], { queryParams });
  }

  getSessionCost(hourlyRate: number): number {
    return (this.filters.sessionDuration / 60) * hourlyRate;
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

  getDayName(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  getMentorAvatar(firstName: string, lastName: string): string {
    // Generate avatar URL based on name initials
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=1976d2&color=fff&size=150`;
  }

  clearFilters(): void {
    this.filters.preferredTime = '';
    this.availableMentors = [];
    this.hasSearched = false;
  }

}
