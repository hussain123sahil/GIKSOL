import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar';
import { AuthService } from '../../services/auth';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

interface StudentProfile {
  _id: string;
  user: string;
  grade?: string;
  school?: string;
  learningGoals: string[];
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-student-account',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './student-account.html',
  styleUrls: ['./student-account.scss']
})
export class StudentAccountComponent implements OnInit {
  currentTab: 'profile' | 'settings' = 'profile';
  
  // Profile data
  userProfile: UserProfile | null = null;
  studentProfile: StudentProfile | null = null;
  
  // Forms
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  // UI state
  isLoading = false;
  isSaving = false;
  showPasswordForm = false;
  showDeleteConfirm = false;
  
  // Success/Error messages
  successMessage = '';
  errorMessage = '';
  
  // Skills options
  skillOptions = [
    'JavaScript', 'Python', 'Java', 'React', 'Angular', 'Node.js', 'SQL', 'MongoDB',
    'AWS', 'Docker', 'Git', 'Machine Learning', 'Data Science', 'Web Development',
    'Mobile Development', 'UI/UX Design', 'Project Management', 'Communication',
    'Leadership', 'Problem Solving', 'Critical Thinking', 'Teamwork'
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public router: Router,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      bio: ['', [Validators.maxLength(500)]],
      grade: ['', [Validators.required]],
      school: ['', [Validators.required]],
      learningGoals: ['', [Validators.required]],
      skills: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadStudentProfile();
  }

  // Password validation
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Load user profile data
  loadUserProfile(): void {
    this.isLoading = true;
    this.http.get<UserProfile>('http://localhost:5000/api/auth/profile', {
      headers: this.authService.getAuthHeaders()
    })
      .subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.populateProfileForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.errorMessage = 'Failed to load profile data';
          this.isLoading = false;
        }
      });
  }

  // Load student profile data
  loadStudentProfile(): void {
    this.http.get<StudentProfile>('http://localhost:5000/api/students/profile')
      .subscribe({
        next: (profile) => {
          this.studentProfile = profile;
        },
        error: (error) => {
          console.error('Error loading student profile:', error);
        }
      });
  }

  // Populate profile form with loaded data
  populateProfileForm(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        firstName: this.userProfile.firstName,
        lastName: this.userProfile.lastName,
        email: this.userProfile.email,
        bio: this.userProfile.bio || ''
      });
    }
    
    if (this.studentProfile) {
      this.profileForm.patchValue({
        grade: this.studentProfile.grade || '',
        school: this.studentProfile.school || '',
        learningGoals: this.studentProfile.learningGoals ? this.studentProfile.learningGoals.join(', ') : '',
        skills: this.studentProfile.skills ? this.studentProfile.skills.join(', ') : ''
      });
    }
  }


  // Switch between tabs
  switchTab(tab: 'profile' | 'settings'): void {
    this.currentTab = tab;
    this.clearMessages();
  }

  // Save profile changes
  saveProfile(): void {
    if (this.profileForm.valid) {
      this.isSaving = true;
      const profileData = this.profileForm.value;
      
      // Separate user profile data and student profile data
      const userProfileData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        bio: profileData.bio
      };
      
      const studentProfileData = {
        grade: profileData.grade,
        school: profileData.school,
        learningGoals: profileData.learningGoals ? profileData.learningGoals.split(',').map((goal: string) => goal.trim()).filter((goal: string) => goal) : [],
        skills: profileData.skills ? profileData.skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill) : []
      };
      
      // Update user profile
      this.http.put('http://localhost:5000/api/auth/profile', userProfileData, {
        headers: this.authService.getAuthHeaders()
      })
        .subscribe({
          next: (response) => {
            // Update student profile
            this.http.put('http://localhost:5000/api/students/profile', studentProfileData, {
              headers: this.authService.getAuthHeaders()
            })
              .subscribe({
                next: (studentResponse) => {
                  this.successMessage = 'Profile updated successfully!';
                  this.isSaving = false;
                  this.loadUserProfile(); // Reload to get updated data
                  this.loadStudentProfile();
                },
                error: (error) => {
                  console.error('Error updating student profile:', error);
                  this.errorMessage = 'Failed to update student profile. Please try again.';
                  this.isSaving = false;
                }
              });
          },
          error: (error) => {
            console.error('Error updating user profile:', error);
            this.errorMessage = 'Failed to update profile. Please try again.';
            this.isSaving = false;
          }
        });
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
    }
  }

  // Change password
  changePassword(): void {
    if (this.passwordForm.valid) {
      this.isSaving = true;
      const passwordData = this.passwordForm.value;
      
      this.http.put('http://localhost:5000/api/auth/change-password', passwordData, {
        headers: this.authService.getAuthHeaders()
      })
        .subscribe({
          next: (response) => {
            this.successMessage = 'Password changed successfully!';
            this.isSaving = false;
            this.showPasswordForm = false;
            this.passwordForm.reset();
          },
          error: (error) => {
            console.error('Error changing password:', error);
            this.errorMessage = 'Failed to change password. Please check your current password.';
            this.isSaving = false;
          }
        });
    } else {
      this.errorMessage = 'Please fill in all password fields correctly.';
    }
  }


  // Delete account
  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.isSaving = true;
      
      this.http.delete('http://localhost:5000/api/auth/account', {
        headers: this.authService.getAuthHeaders()
      })
        .subscribe({
          next: (response) => {
            this.successMessage = 'Account deleted successfully. Redirecting to login...';
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          },
          error: (error) => {
            console.error('Error deleting account:', error);
            this.errorMessage = 'Failed to delete account. Please try again.';
            this.isSaving = false;
          }
        });
    }
  }

  // Upload profile picture
  onProfilePictureChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      this.http.post('http://localhost:5000/api/users/upload-profile-picture', formData)
        .subscribe({
          next: (response: any) => {
            this.successMessage = 'Profile picture updated successfully!';
            if (this.userProfile) {
              this.userProfile.profilePicture = response.profilePicture;
            }
          },
          error: (error) => {
            console.error('Error uploading profile picture:', error);
            this.errorMessage = 'Failed to upload profile picture. Please try again.';
          }
        });
    }
  }

  // Get profile picture URL
  getProfilePictureUrl(): string {
    if (this.userProfile?.profilePicture) {
      return this.userProfile.profilePicture;
    }
    
    const firstName = this.userProfile?.firstName || '';
    const lastName = this.userProfile?.lastName || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=1976d2&color=fff&size=200&bold=true`;
  }

  // Clear messages
  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Format date for display
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Get form control error message
  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `${fieldName} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  // Get password form error message
  getPasswordError(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return 'Password must be at least 8 characters';
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
    }
    return '';
  }

}
