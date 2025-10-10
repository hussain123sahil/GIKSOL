import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth';
import { MentorService, Mentor as BackendMentor } from '../../services/mentor';
import { MentorAvailabilityService } from '../../services/mentor-availability.service';
import { MentorSidebarComponent } from '../mentor-sidebar/mentor-sidebar';
import { SidebarComponent } from '../sidebar/sidebar';
import { EditMentorProfileModalComponent, MentorProfile } from '../edit-mentor-profile-modal/edit-mentor-profile-modal';

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
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  availability: {
    monday: { isAvailable: boolean, timeSlots: Array<{ startTime: string, endTime: string, isActive: boolean }> };
    tuesday: { isAvailable: boolean, timeSlots: Array<{ startTime: string, endTime: string, isActive: boolean }> };
    wednesday: { isAvailable: boolean, timeSlots: Array<{ startTime: string, endTime: string, isActive: boolean }> };
    thursday: { isAvailable: boolean, timeSlots: Array<{ startTime: string, endTime: string, isActive: boolean }> };
    friday: { isAvailable: boolean, timeSlots: Array<{ startTime: string, endTime: string, isActive: boolean }> };
    saturday: { isAvailable: boolean, timeSlots: Array<{ startTime: string, endTime: string, isActive: boolean }> };
    sunday: { isAvailable: boolean, timeSlots: Array<{ startTime: string, endTime: string, isActive: boolean }> };
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
  imports: [CommonModule, FormsModule, MentorSidebarComponent, SidebarComponent, EditMentorProfileModalComponent],
  templateUrl: './mentor-profile.html',
  styleUrls: ['./mentor-profile.scss']
})
export class MentorProfileComponent implements OnInit {
  mentor: Mentor | null = null;
  currentUser: User | null = null;
  isLoading = true;
  showBookingForm = false;
  isOwnProfile = false;
  
  // Edit Profile Modal
  showEditProfileModal = false;
  editProfileData: MentorProfile = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    position: '',
    expertise: [],
    bio: '',
    linkedinUrl: '',
    githubUrl: '',
    website: '',
    experience: [],
    education: [],
    certifications: []
  };
  
  // Toast notification
  showToast = false;
  toastMessage = '';
  isSuccessToast = false;
  
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
    private mentorService: MentorService,
    private availabilityService: MentorAvailabilityService
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

    this.http.get(`${apiUrl}/${mentorId}`, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
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
            experience: response.mentor.experience || [],
            availability: {
              monday: { isAvailable: false, timeSlots: [] },
              tuesday: { isAvailable: false, timeSlots: [] },
              wednesday: { isAvailable: false, timeSlots: [] },
              thursday: { isAvailable: false, timeSlots: [] },
              friday: { isAvailable: false, timeSlots: [] },
              saturday: { isAvailable: false, timeSlots: [] },
              sunday: { isAvailable: false, timeSlots: [] }
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
        // Load availability after profile is loaded with a small delay
        setTimeout(() => {
          this.loadAvailability();
        }, 100);
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
          experience: mentor.experience || [],
          availability: mentor.availability || {
            monday: { isAvailable: false, timeSlots: [] },
            tuesday: { isAvailable: false, timeSlots: [] },
            wednesday: { isAvailable: false, timeSlots: [] },
            thursday: { isAvailable: false, timeSlots: [] },
            friday: { isAvailable: false, timeSlots: [] },
            saturday: { isAvailable: false, timeSlots: [] },
            sunday: { isAvailable: false, timeSlots: [] }
          },
          education: mentor.education || [],
          certifications: mentor.certifications || []
        };
        this.isLoading = false;
        // Load availability after profile is loaded with a small delay
        setTimeout(() => {
          this.loadAvailability();
        }, 100);
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
      experience: [
        {
          company: 'Google',
          position: 'Senior Software Engineer',
          startDate: '2018-01-01',
          endDate: '2023-12-31',
          description: 'Led development of scalable web applications using React and Node.js. Mentored junior developers and contributed to open-source projects.'
        },
        {
          company: 'Microsoft',
          position: 'Software Engineer',
          startDate: '2015-06-01',
          endDate: '2017-12-31',
          description: 'Developed enterprise software solutions and collaborated with cross-functional teams to deliver high-quality products.'
        }
      ],
      availability: {
        monday: { isAvailable: false, timeSlots: [] },
        tuesday: { isAvailable: false, timeSlots: [] },
        wednesday: { isAvailable: false, timeSlots: [] },
        thursday: { isAvailable: false, timeSlots: [] },
        friday: { isAvailable: false, timeSlots: [] },
        saturday: { isAvailable: false, timeSlots: [] },
        sunday: { isAvailable: false, timeSlots: [] }
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
    return `https://ui-avatars.com/api/?name=${initials}&background=4f46e5&color=ffffff&size=300&bold=true`;
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
      .filter(([_, schedule]) => schedule.isAvailable)
      .map(([day, schedule]) => day.charAt(0).toUpperCase() + day.slice(1));
    
    return availableDays.join(', ');
  }

  getTotalPrice(): number {
    return this.bookingForm.sessionDuration * (this.mentor?.hourlyRate || 0) / 60;
  }

  loadAvailability(): void {
    if (!this.mentor?.id) return;

    this.availabilityService.getAvailability(this.mentor.id).subscribe({
      next: (response: any) => {
        if (response.availability && this.mentor) {
          this.mentor.availability = response.availability;
        }
      },
      error: (error) => {
        console.error('Error loading availability for profile:', error);
      }
    });
  }

  getAvailabilityDays(): Array<{name: string, available: boolean, timeSlots: Array<{startTime: string, endTime: string}>}> {
    if (!this.mentor) return [];
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(day => {
      const dayData = this.mentor!.availability[day as keyof typeof this.mentor.availability];
      return {
        name: day.charAt(0).toUpperCase() + day.slice(1),
        available: dayData.isAvailable,
        timeSlots: dayData.timeSlots
          .filter(slot => slot.isActive)
          .map(slot => ({ startTime: slot.startTime, endTime: slot.endTime }))
      };
    });
  }

  closeBookingModal(event: Event): void {
    if (event.target === event.currentTarget) {
      this.showBookingForm = false;
    }
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatDateRange(startDate: string, endDate: string): string {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const startFormatted = start.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!endDate || endDate === '') {
      return `${startFormatted} - Present`;
    }
    
    const end = new Date(endDate);
    const endFormatted = end.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    return `${startFormatted} - ${endFormatted}`;
  }

  // Edit Profile Modal Methods
  openEditProfileModal(): void {
    if (this.mentor) {
      // If no experience entries exist, create one from current position/company
      let experienceData = this.mentor.experience ? [...this.mentor.experience] : [];
      
      if (experienceData.length === 0) {
        // Create a default experience entry from current position
        experienceData = [{
          company: this.mentor.company,
          position: this.mentor.position,
          startDate: '2020-01-01', // Provide a default start date
          endDate: '',
          description: ''
        }];
      }
      
      this.editProfileData = {
        id: this.mentor.id,
        firstName: this.mentor.firstName,
        lastName: this.mentor.lastName,
        email: this.currentUser?.email || '',
        profilePicture: this.mentor.profilePicture,
        company: this.mentor.company,
        position: this.mentor.position,
        expertise: [...this.mentor.expertise],
        bio: this.mentor.bio || '',
        linkedinUrl: this.mentor.linkedinUrl || '',
        githubUrl: '', // Add githubUrl field to Mentor interface if needed
        website: '', // Add website field to Mentor interface if needed
        experience: experienceData,
        education: this.mentor.education ? [...this.mentor.education] : [],
        certifications: this.mentor.certifications ? [...this.mentor.certifications] : []
      };
      this.showEditProfileModal = true;
    }
  }

  onProfileClose(): void {
    this.showEditProfileModal = false;
  }

  onProfileSave(profileData: MentorProfile): void {
    // Make API call to update mentor profile
    const apiUrl = 'http://localhost:5000/api/mentors/profile';
    
    this.http.put(apiUrl, profileData, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (response: any) => {
        console.log('Profile updated successfully:', response);
        
        // Update local mentor data with the response
        if (this.mentor && response.mentor) {
          // Update user fields
          if (response.mentor.user) {
            this.mentor.firstName = response.mentor.user.firstName;
            this.mentor.lastName = response.mentor.user.lastName;
            this.mentor.profilePicture = response.mentor.user.profilePicture;
          }
          
          // Update mentor fields
          this.mentor.company = response.mentor.company;
          this.mentor.position = response.mentor.position;
          this.mentor.expertise = response.mentor.expertise;
          this.mentor.bio = response.mentor.bio;
          this.mentor.linkedinUrl = response.mentor.linkedinUrl;
          // Add other fields as needed
          if (response.mentor.experience) {
            this.mentor.experience = response.mentor.experience;
          }
          if (response.mentor.education) {
            this.mentor.education = response.mentor.education;
          }
          if (response.mentor.certifications) {
            this.mentor.certifications = response.mentor.certifications;
          }
        }
        
        // Update current user data in localStorage and auth service
        if (response.mentor.user && this.currentUser?.id) {
          const updatedUser: User = {
            id: this.currentUser.id,
            firstName: response.mentor.user.firstName,
            lastName: response.mentor.user.lastName,
            email: response.mentor.user.email,
            role: 'mentor' as 'mentor',
            profilePicture: response.mentor.user.profilePicture
          };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          // Update auth service current user
          this.authService.updateCurrentUser(updatedUser);
        }
        
        this.showEditProfileModal = false;
        
        // Show success message
        this.showSuccessToast('Profile updated successfully!');
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        
        // Show error message
        const errorMessage = error.error?.message || 'Failed to update profile. Please try again.';
        this.showErrorToast(`Error: ${errorMessage}`);
      }
    });
  }

  // Toast notification methods
  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.isSuccessToast = true;
    this.showToast = true;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  showErrorToast(message: string): void {
    this.toastMessage = message;
    this.isSuccessToast = false;
    this.showToast = true;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  hideToast(): void {
    this.showToast = false;
  }

}
