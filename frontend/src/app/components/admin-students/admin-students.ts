import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth';
import { AdminService, User as AdminUser, StudentProfile } from '../../services/admin.service';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './admin-students.html',
  styleUrls: ['./admin-students.scss']
})
export class AdminStudentsComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  
  // Students data
  students: (AdminUser & { profile: StudentProfile })[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;
  
  // Search and filters
  searchTerm = '';
  
  // Modal states
  showStudentModal = false;
  showDeleteModal = false;
  selectedStudent: (AdminUser & { profile: StudentProfile }) | null = null;
  isEditing = false;
  
  // Form data
  studentForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isActive: true,
    // Student profile fields
    learningGoals: [''],
    currentLevel: 'beginner',
    interests: [''],
    preferredLearningStyle: 'visual',
    timeCommitment: '1-2 hours/week',
    budget: { min: 0, max: 100 },
    bio: ''
  };

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadStudents();
  }


  loadStudents(): void {
    this.isLoading = true;
    this.adminService.getStudents(this.currentPage, this.pageSize, this.searchTerm).subscribe({
      next: (response) => {
        this.students = response.students;
        this.totalPages = response.pagination.totalPages;
        this.totalItems = response.pagination.totalStudents || 0;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.isLoading = false;
      }
    });
  }

  search(): void {
    this.currentPage = 1;
    this.loadStudents();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadStudents();
  }

  openStudentModal(student?: (AdminUser & { profile: StudentProfile })): void {
    this.isEditing = !!student;
    this.selectedStudent = student || null;
    
    // Initialize form with default values
    this.studentForm = {
      firstName: student?.firstName || '',
      lastName: student?.lastName || '',
      email: student?.email || '',
      password: '',
      isActive: student?.isActive ?? true,
      learningGoals: student?.profile?.learningGoals || [''],
      currentLevel: student?.profile?.currentLevel || 'beginner',
      interests: student?.profile?.interests || [''],
      preferredLearningStyle: student?.profile?.preferredLearningStyle || 'visual',
      timeCommitment: student?.profile?.timeCommitment || '1-2 hours/week',
      budget: student?.profile?.budget || { min: 0, max: 100 },
      bio: student?.profile?.bio || ''
    };
    
    this.showStudentModal = true;
  }

  closeStudentModal(): void {
    this.showStudentModal = false;
    this.selectedStudent = null;
    this.isEditing = false;
    this.studentForm = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      isActive: true,
      learningGoals: [''],
      currentLevel: 'beginner',
      interests: [''],
      preferredLearningStyle: 'visual',
      timeCommitment: '1-2 hours/week',
      budget: { min: 0, max: 100 },
      bio: ''
    };
  }

  saveStudent(): void {
    if (!this.studentForm.firstName || !this.studentForm.lastName || !this.studentForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    if (!this.isEditing && !this.studentForm.password) {
      alert('Password is required for new students');
      return;
    }

    const userData: any = {
      firstName: this.studentForm.firstName,
      lastName: this.studentForm.lastName,
      email: this.studentForm.email,
      role: 'student',
      isActive: this.studentForm.isActive
    };

    if (this.isEditing && this.studentForm.password) {
      userData.password = this.studentForm.password;
    }

    const profileData = {
      learningGoals: this.studentForm.learningGoals.filter(goal => goal.trim() !== ''),
      currentLevel: this.studentForm.currentLevel,
      interests: this.studentForm.interests.filter(interest => interest.trim() !== ''),
      preferredLearningStyle: this.studentForm.preferredLearningStyle,
      timeCommitment: this.studentForm.timeCommitment,
      budget: this.studentForm.budget,
      bio: this.studentForm.bio
    };

    if (this.isEditing && this.selectedStudent) {
      // Update user first
      this.adminService.updateUser(this.selectedStudent.id, userData).subscribe({
        next: (response) => {
          // Then update profile
          this.adminService.updateStudentProfile(this.selectedStudent!.id, profileData).subscribe({
            next: (profileResponse) => {
              console.log('Student updated:', profileResponse);
              this.closeStudentModal();
              this.loadStudents();
            },
            error: (error) => {
              console.error('Error updating student profile:', error);
              alert('Error updating student profile');
            }
          });
        },
        error: (error) => {
          console.error('Error updating student:', error);
          alert('Error updating student');
        }
      });
    } else {
      // Create new student
      if (this.studentForm.password) {
        userData.password = this.studentForm.password;
      }
      
      this.adminService.createUser(userData).subscribe({
        next: (response) => {
          // Update the profile after creation
          this.adminService.updateStudentProfile(response.user.id, profileData).subscribe({
            next: (profileResponse) => {
              console.log('Student created:', profileResponse);
              this.closeStudentModal();
              this.loadStudents();
            },
            error: (error) => {
              console.error('Error updating student profile:', error);
              alert('Error updating student profile');
            }
          });
        },
        error: (error) => {
          console.error('Error creating student:', error);
          alert('Error creating student');
        }
      });
    }
  }

  openDeleteModal(student: (AdminUser & { profile: StudentProfile })): void {
    this.selectedStudent = student;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedStudent = null;
  }

  deleteStudent(): void {
    if (!this.selectedStudent) return;

    this.adminService.deleteUser(this.selectedStudent.id).subscribe({
      next: (response) => {
        console.log('Student deleted:', response);
        this.closeDeleteModal();
        this.loadStudents();
      },
      error: (error) => {
        console.error('Error deleting student:', error);
        alert('Error deleting student');
      }
    });
  }

  toggleStudentStatus(student: (AdminUser & { profile: StudentProfile })): void {
    this.adminService.updateUser(student.id, { isActive: !student.isActive }).subscribe({
      next: (response) => {
        console.log('Student status updated:', response);
        this.loadStudents();
      },
      error: (error) => {
        console.error('Error updating student status:', error);
        alert('Error updating student status');
      }
    });
  }

  addLearningGoal(): void {
    this.studentForm.learningGoals.push('');
  }

  removeLearningGoal(index: number): void {
    this.studentForm.learningGoals.splice(index, 1);
  }

  addInterest(): void {
    this.studentForm.interests.push('');
  }

  removeInterest(index: number): void {
    this.studentForm.interests.splice(index, 1);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return '#2e7d32';
      case 'inactive':
        return '#d32f2f';
      default:
        return '#666';
    }
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
