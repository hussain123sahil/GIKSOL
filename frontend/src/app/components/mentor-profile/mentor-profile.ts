import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth';
import { MentorService, Mentor as BackendMentor } from '../../services/mentor';
import { MentorSidebarComponent } from '../mentor-sidebar/mentor-sidebar';

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  expertise: string[];
  hourlyRate: number;
  rating: number;
  totalSessions: number;
  bio: string;
  linkedinUrl?: string;
  profilePicture?: string;
  isAvailable: boolean;
  availability: {
    monday: { start: string, end: string, available: boolean };
    tuesday: { start: string, end: string, available: boolean };
    wednesday: { start: string, end: string, available: boolean };
    thursday: { start: string, end: string, available: boolean };
    friday: { start: string, end: string, available: boolean };
    saturday: { start: string, end: string, available: boolean };
    sunday: { start: string, end: string, available: boolean };
  };
  education: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

@Component({
  selector: 'app-mentor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MentorSidebarComponent],
  templateUrl: './mentor-profile.html',
  styleUrls: ['./mentor-profile.scss']
})
export class MentorProfileComponent implements OnInit {
  mentor: Mentor | null = null;
  currentUser: User | null = null;
  isLoading = true;
  showBookingForm = false;
  isOwnProfile = false;
  
  // Booking form
  bookingForm = {
    preferredDate: '',
    preferredTime: '',
    sessionDuration: 60,
    notes: '',
    sessionType: 'video'
  };

  availableTimeSlots: string[] = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private mentorService: MentorService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    const mentorId = this.route.snapshot.paramMap.get('id');
    
    if (mentorId) {
      // Viewing another mentor's profile
      this.isOwnProfile = false;
      this.loadMentorProfile(mentorId);
    } else {
      // Viewing own profile
      this.isOwnProfile = true;
      if (this.currentUser) {
        this.loadOwnProfile();
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  loadOwnProfile(): void {
    this.isLoading = true;
    
    // Load mentor's own profile from dashboard API
    const apiUrl = 'http://localhost:5000/api/sessions/mentor-dashboard';
    const mentorId = this.currentUser?.id;

    if (!mentorId) {
      this.router.navigate(['/login']);
      return;
    }

    this.http.get(`${apiUrl}/${mentorId}`).subscribe({
      next: (response: any) => {
        if (response.mentor) {
          this.mentor = {
            id: response.mentor.id,
            firstName: response.mentor.firstName,
            lastName: response.mentor.lastName,
            company: response.mentor.company,
            position: response.mentor.position,
            expertise: response.mentor.expertise,
            hourlyRate: 75, // Default value, should be fetched from mentor profile
            rating: Math.round(response.mentor.rating * 10) / 10, // Round to 1 decimal place
            totalSessions: response.mentor.totalSessions,
            bio: 'I am passionate about mentoring and helping others grow in their careers. I believe in hands-on learning with real-world projects.',
            linkedinUrl: 'https://linkedin.com/in/mentor',
            profilePicture: response.mentor.profilePicture || this.getDefaultProfilePicture(response.mentor.firstName, response.mentor.lastName),
            isAvailable: true,
            availability: {
              monday: { start: '09:00', end: '17:00', available: true },
              tuesday: { start: '09:00', end: '17:00', available: true },
              wednesday: { start: '09:00', end: '17:00', available: true },
              thursday: { start: '09:00', end: '17:00', available: true },
              friday: { start: '09:00', end: '15:00', available: true },
              saturday: { start: '10:00', end: '14:00', available: false },
              sunday: { start: '', end: '', available: false }
            },
            education: [
              { degree: 'Master of Science in Computer Science', institution: 'University', year: 2020 },
              { degree: 'Bachelor of Science in Software Engineering', institution: 'University', year: 2018 }
            ],
            certifications: [
              { name: 'Professional Certification', issuer: 'Issuing Body', date: '2023' }
            ]
          };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading own profile:', error);
        this.isLoading = false;
      }
    });
  }

  loadMentorProfile(mentorId: string): void {
    this.isLoading = true;
    
    this.mentorService.getMentorById(mentorId).subscribe({
      next: (mentor: BackendMentor) => {
        // Transform backend mentor data to display format
        this.mentor = {
          id: mentor._id,
          firstName: mentor.user.firstName,
          lastName: mentor.user.lastName,
          company: mentor.company,
          position: mentor.position,
          expertise: mentor.expertise,
          hourlyRate: mentor.hourlyRate,
          rating: Math.round(mentor.rating * 10) / 10, // Round to 1 decimal place
          totalSessions: mentor.totalSessions,
          bio: mentor.bio,
          linkedinUrl: mentor.linkedinUrl,
          profilePicture: mentor.user.profilePicture || this.getDefaultProfilePicture(mentor.user.firstName, mentor.user.lastName),
          isAvailable: mentor.isAvailable,
          availability: mentor.availability || {
            monday: { start: '09:00', end: '17:00', available: true },
            tuesday: { start: '09:00', end: '17:00', available: true },
            wednesday: { start: '09:00', end: '17:00', available: true },
            thursday: { start: '09:00', end: '17:00', available: true },
            friday: { start: '09:00', end: '15:00', available: true },
            saturday: { start: '10:00', end: '14:00', available: false },
            sunday: { start: '', end: '', available: false }
          },
          education: mentor.education || [],
          certifications: mentor.certifications || []
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading mentor profile:', error);
        this.isLoading = false;
        // Fallback to mock data if API fails
        this.loadMockMentorProfile(mentorId);
      }
    });
  }

  private loadMockMentorProfile(mentorId: string): void {
    // Fallback mock data
    this.mentor = {
      id: mentorId,
      firstName: 'John',
      lastName: 'Smith',
      company: 'Google',
      position: 'Senior Software Engineer',
      expertise: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS'],
      hourlyRate: 75,
      rating: 4.9,
      totalSessions: 150,
      bio: 'I am a Senior Software Engineer at Google with over 8 years of experience in full-stack development. I specialize in JavaScript, React, and Node.js, and have helped hundreds of developers advance their careers. I\'m passionate about teaching and mentoring, and I believe in hands-on learning with real-world projects.',
      linkedinUrl: 'https://linkedin.com/in/johnsmith',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      isAvailable: true,
      availability: {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '15:00', available: true },
        saturday: { start: '10:00', end: '14:00', available: true },
        sunday: { start: '', end: '', available: false }
      },
      education: [
        { degree: 'Master of Science in Computer Science', institution: 'Stanford University', year: 2016 },
        { degree: 'Bachelor of Science in Software Engineering', institution: 'UC Berkeley', year: 2014 }
      ],
      certifications: [
        { name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', date: '2023' },
        { name: 'Google Cloud Professional Developer', issuer: 'Google Cloud', date: '2022' },
        { name: 'React Developer Certification', issuer: 'Meta', date: '2021' }
      ]
    };
  }

  private getDefaultProfilePicture(firstName: string, lastName: string): string {
    // Generate a default profile picture based on name initials
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return `https://via.placeholder.com/300x300/4f46e5/ffffff?text=${initials}`;
  }

  toggleBookingForm(): void {
    this.showBookingForm = !this.showBookingForm;
  }

  submitBooking(): void {
    if (this.mentor) {
      // In a real app, this would send the booking request to the backend
      console.log('Booking request:', {
        mentorId: this.mentor.id,
        ...this.bookingForm
      });
      
      // Navigate to booking confirmation page
      this.router.navigate(['/booking', this.mentor.id], {
        queryParams: this.bookingForm
      });
    }
  }

  submitBookingRequest(): void {
    this.submitBooking();
  }

  goBack(): void {
    this.router.navigate(['/mentors']);
  }

  getAvailabilityText(): string {
    if (!this.mentor) return '';
    
    const availableDays = Object.entries(this.mentor.availability)
      .filter(([_, schedule]) => schedule.available)
      .map(([day, schedule]) => day.charAt(0).toUpperCase() + day.slice(1));
    
    return availableDays.join(', ');
  }

  getTotalPrice(): number {
    return this.bookingForm.sessionDuration * (this.mentor?.hourlyRate || 0) / 60;
  }

  getAvailabilityDays(): Array<{name: string, available: boolean, start: string, end: string}> {
    if (!this.mentor) return [];
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(day => ({
      name: day.charAt(0).toUpperCase() + day.slice(1),
      available: this.mentor!.availability[day as keyof typeof this.mentor.availability].available,
      start: this.mentor!.availability[day as keyof typeof this.mentor.availability].start,
      end: this.mentor!.availability[day as keyof typeof this.mentor.availability].end
    }));
  }

  closeBookingModal(event: Event): void {
    if (event.target === event.currentTarget) {
      this.showBookingForm = false;
    }
  }
}
