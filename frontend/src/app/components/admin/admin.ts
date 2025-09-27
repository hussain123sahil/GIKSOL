import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth';
import { AdminService, DashboardStats, User as AdminUser, StudentProfile, MentorProfile, Session, Connection } from '../../services/admin.service';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss']
})
export class AdminComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  activeTab = 'dashboard';
  
  // Dashboard data
  dashboardStats: DashboardStats | null = null;
  
  // Users data
  users: AdminUser[] = [];
  students: (AdminUser & { profile: StudentProfile })[] = [];
  mentors: (AdminUser & { profile: MentorProfile })[] = [];
  sessions: Session[] = [];
  connections: Connection[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;
  
  // Search and filters
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';
  
  // Modal states
  showUserModal = false;
  showDeleteModal = false;
  selectedUser: AdminUser | null = null;
  isEditing = false;
  
  // Form data
  userForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'mentor' | 'admin',
    isActive: true
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

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.isLoading = false;
      }
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getUsers(this.currentPage, this.pageSize, this.selectedRole, this.searchTerm).subscribe({
      next: (response) => {
        this.users = response.users;
        this.totalPages = response.pagination.totalPages;
        this.totalItems = response.pagination.totalUsers || 0;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
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

  loadMentors(): void {
    this.isLoading = true;
    this.adminService.getMentors(this.currentPage, this.pageSize, this.searchTerm).subscribe({
      next: (response) => {
        this.mentors = response.mentors;
        this.totalPages = response.pagination.totalPages;
        this.totalItems = response.pagination.totalMentors || 0;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading mentors:', error);
        this.isLoading = false;
      }
    });
  }

  loadSessions(): void {
    this.isLoading = true;
    this.adminService.getSessions(this.currentPage, this.pageSize, this.selectedStatus).subscribe({
      next: (response) => {
        this.sessions = response.sessions;
        this.totalPages = response.pagination.totalPages;
        this.totalItems = response.pagination.totalSessions || 0;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.isLoading = false;
      }
    });
  }

  loadConnections(): void {
    this.isLoading = true;
    this.adminService.getConnections(this.currentPage, this.pageSize, this.selectedStatus).subscribe({
      next: (response) => {
        this.connections = response.connections;
        this.totalPages = response.pagination.totalPages;
        this.totalItems = response.pagination.totalConnections || 0;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading connections:', error);
      this.isLoading = false;
      }
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    
    switch (tab) {
      case 'users':
        this.loadUsers();
        break;
      case 'students':
        this.loadStudents();
        break;
      case 'mentors':
        this.loadMentors();
        break;
      case 'sessions':
        this.loadSessions();
        break;
      case 'connections':
        this.loadConnections();
        break;
      case 'dashboard':
        this.loadDashboardData();
        break;
    }
  }

  search(): void {
    this.currentPage = 1;
    switch (this.activeTab) {
      case 'users':
        this.loadUsers();
        break;
      case 'students':
        this.loadStudents();
        break;
      case 'mentors':
        this.loadMentors();
        break;
      case 'sessions':
        this.loadSessions();
        break;
      case 'connections':
        this.loadConnections();
        break;
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    switch (this.activeTab) {
      case 'users':
        this.loadUsers();
        break;
      case 'students':
        this.loadStudents();
        break;
      case 'mentors':
        this.loadMentors();
        break;
      case 'sessions':
        this.loadSessions();
        break;
      case 'connections':
        this.loadConnections();
        break;
    }
  }

  openUserModal(user?: AdminUser): void {
    this.isEditing = !!user;
    this.selectedUser = user || null;
    
    if (user) {
      this.userForm = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        role: user.role,
        isActive: user.isActive
      };
    } else {
      this.userForm = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'student',
        isActive: true
      };
    }
    
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
    this.isEditing = false;
    this.userForm = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'student',
      isActive: true
    };
  }

  saveUser(): void {
    if (!this.userForm.firstName || !this.userForm.lastName || !this.userForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    if (!this.isEditing && !this.userForm.password) {
      alert('Password is required for new users');
      return;
    }

    const userData: any = { ...this.userForm };
    if (this.isEditing && !userData.password) {
      delete userData.password;
    }

    if (this.isEditing && this.selectedUser) {
      this.adminService.updateUser(this.selectedUser.id, userData).subscribe({
        next: (response) => {
          console.log('User updated:', response);
          this.closeUserModal();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error updating user:', error);
          alert('Error updating user');
        }
      });
    } else {
      this.adminService.createUser(userData).subscribe({
        next: (response) => {
          console.log('User created:', response);
          this.closeUserModal();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error creating user:', error);
          alert('Error creating user');
        }
      });
    }
  }

  openDeleteModal(user: AdminUser): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  deleteUser(): void {
    if (!this.selectedUser) return;

    this.adminService.deleteUser(this.selectedUser.id).subscribe({
      next: (response) => {
        console.log('User deleted:', response);
        this.closeDeleteModal();
        
        // Refresh the appropriate list based on active tab
        if (this.activeTab === 'students') {
          this.loadStudents();
        } else if (this.activeTab === 'mentors') {
          this.loadMentors();
        } else {
          this.loadUsers();
        }
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    });
  }

  toggleUserStatus(user: AdminUser): void {
    this.adminService.updateUser(user.id, { isActive: !user.isActive }).subscribe({
      next: (response) => {
        console.log('User status updated:', response);
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error updating user status:', error);
        alert('Error updating user status');
      }
    });
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
      case 'scheduled':
      case 'accepted':
      case 'completed':
        return '#2e7d32';
      case 'inactive':
      case 'cancelled':
      case 'rejected':
        return '#d32f2f';
      case 'pending':
        return '#f39c12';
      default:
        return '#666';
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'admin':
        return '#9c27b0';
      case 'mentor':
        return '#2196f3';
      case 'student':
        return '#4caf50';
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