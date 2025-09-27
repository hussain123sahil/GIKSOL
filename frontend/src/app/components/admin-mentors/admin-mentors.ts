import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth';
import { AdminService, User as AdminUser, MentorProfile } from '../../services/admin.service';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar';

@Component({
  selector: 'app-admin-mentors',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './admin-mentors.html',
  styleUrls: ['./admin-mentors.scss']
})
export class AdminMentorsComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  
  // Mentors data
  mentors: (AdminUser & { profile: MentorProfile })[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;
  
  // Search and filters
  searchTerm = '';
  
  // Modal states
  showMentorModal = false;
  showDeleteModal = false;
  isEditing = false;
  selectedMentor: (AdminUser & { profile: MentorProfile }) | null = null;
  
  // Mentor form
  mentorForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isActive: true,
    company: '',
    position: '',
    expertise: [''],
    hourlyRate: 0,
    bio: '',
    linkedinUrl: '',
    education: [{ degree: '', institution: '', year: new Date().getFullYear() }],
    certifications: [{ name: '', issuer: '', date: '' }],
    isAvailable: true
  };

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadMentors();
  }

  loadMentors(): void {
    this.isLoading = true;
    this.adminService.getMentors(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.mentors = response.mentors;
          this.totalItems = response.pagination.totalMentors || 0;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading mentors:', error);
          this.isLoading = false;
        }
      });
  }

  search(): void {
    this.currentPage = 1;
    this.loadMentors();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadMentors();
  }

  openMentorModal(mentor?: (AdminUser & { profile: MentorProfile })): void {
    this.isEditing = !!mentor;
    this.selectedMentor = mentor || null;
    
    // Initialize form with default values
    this.mentorForm = {
      firstName: mentor?.firstName || '',
      lastName: mentor?.lastName || '',
      email: mentor?.email || '',
      password: '',
      isActive: mentor?.isActive ?? true,
      company: mentor?.profile?.company || '',
      position: mentor?.profile?.position || '',
      expertise: mentor?.profile?.expertise || [''],
      hourlyRate: mentor?.profile?.hourlyRate || 0,
      bio: mentor?.profile?.bio || '',
      linkedinUrl: mentor?.profile?.linkedinUrl || '',
      education: mentor?.profile?.education || [{ degree: '', institution: '', year: new Date().getFullYear() }],
      certifications: mentor?.profile?.certifications || [{ name: '', issuer: '', date: '' }],
      isAvailable: mentor?.profile?.isAvailable ?? true
    };
    
    this.showMentorModal = true;
  }

  closeMentorModal(): void {
    this.showMentorModal = false;
    this.selectedMentor = null;
    this.isEditing = false;
  }

  saveMentor(): void {
    if (!this.isFormValid()) return;

    const mentorData = {
      ...this.mentorForm,
      role: 'mentor' as const
    };

    if (this.isEditing && this.selectedMentor) {
      this.adminService.updateUser(this.selectedMentor.id, mentorData)
        .subscribe({
          next: () => {
            this.closeMentorModal();
            this.loadMentors();
          },
          error: (error) => console.error('Error updating mentor:', error)
        });
    } else {
      this.adminService.createUser(mentorData)
        .subscribe({
          next: () => {
            this.closeMentorModal();
            this.loadMentors();
          },
          error: (error) => console.error('Error creating mentor:', error)
        });
    }
  }

  openDeleteModal(mentor: AdminUser & { profile: MentorProfile }): void {
    this.selectedMentor = mentor;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedMentor = null;
  }

  deleteMentor(): void {
    if (!this.selectedMentor) return;

    this.adminService.deleteUser(this.selectedMentor.id)
      .subscribe({
        next: () => {
          this.closeDeleteModal();
          this.loadMentors();
        },
        error: (error) => console.error('Error deleting mentor:', error)
      });
  }

  toggleMentorStatus(mentor: AdminUser & { profile: MentorProfile }): void {
    this.adminService.updateUser(mentor.id, { isActive: !mentor.isActive })
      .subscribe({
        next: () => {
          this.loadMentors();
        },
        error: (error) => console.error('Error toggling mentor status:', error)
      });
  }

  addExpertise(): void {
    this.mentorForm.expertise.push('');
  }

  removeExpertise(index: number): void {
    this.mentorForm.expertise.splice(index, 1);
  }

  addEducation(): void {
    this.mentorForm.education.push({ degree: '', institution: '', year: new Date().getFullYear() });
  }

  removeEducation(index: number): void {
    this.mentorForm.education.splice(index, 1);
  }

  addCertification(): void {
    this.mentorForm.certifications.push({ name: '', issuer: '', date: '' });
  }

  removeCertification(index: number): void {
    this.mentorForm.certifications.splice(index, 1);
  }

  isFormValid(): boolean {
    return !!(this.mentorForm.firstName && this.mentorForm.lastName && this.mentorForm.email);
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getStatusColor(status: string): string {
    return status === 'active' ? '#28a745' : '#dc3545';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
