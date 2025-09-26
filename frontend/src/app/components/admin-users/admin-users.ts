import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth';
import { AdminService, User as AdminUser } from '../../services/admin.service';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.scss']
})
export class AdminUsersComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  
  // Users data
  users: AdminUser[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;
  
  // Search and filters
  searchTerm = '';
  roleFilter = 'all'; // 'all', 'student', 'mentor', 'admin'
  statusFilter = 'all'; // 'all', 'active', 'inactive'
  
  // Modal states
  showUserModal = false;
  showDeleteModal = false;
  isEditing = false;
  selectedUser: AdminUser | null = null;
  
  // User form
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
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getUsers(this.currentPage, this.pageSize, this.searchTerm, this.roleFilter, this.statusFilter)
      .subscribe({
        next: (response) => {
          this.users = response.users;
          this.totalItems = response.pagination.totalUsers || 0;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.isLoading = false;
        }
      });
  }

  search(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onRoleFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  openUserModal(user?: AdminUser): void {
    this.isEditing = !!user;
    this.selectedUser = user || null;
    
    // Initialize form with default values
    this.userForm = {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'student',
      isActive: user?.isActive ?? true
    };
    
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
    this.isEditing = false;
  }

  saveUser(): void {
    if (!this.isFormValid()) return;

    const userData = {
      ...this.userForm
    };

    if (this.isEditing && this.selectedUser) {
      this.adminService.updateUser(this.selectedUser.id, userData)
        .subscribe({
          next: () => {
            this.closeUserModal();
            this.loadUsers();
          },
          error: (error) => console.error('Error updating user:', error)
        });
    } else {
      this.adminService.createUser(userData)
        .subscribe({
          next: () => {
            this.closeUserModal();
            this.loadUsers();
          },
          error: (error) => console.error('Error creating user:', error)
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

    this.adminService.deleteUser(this.selectedUser.id)
      .subscribe({
        next: () => {
          this.closeDeleteModal();
          this.loadUsers();
        },
        error: (error) => console.error('Error deleting user:', error)
      });
  }

  toggleUserStatus(user: AdminUser): void {
    this.adminService.updateUser(user.id, { isActive: !user.isActive })
      .subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => console.error('Error toggling user status:', error)
      });
  }

  changeUserRole(user: AdminUser, newRole: 'student' | 'mentor' | 'admin'): void {
    this.adminService.updateUser(user.id, { role: newRole })
      .subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => console.error('Error changing user role:', error)
      });
  }

  isFormValid(): boolean {
    return !!(this.userForm.firstName && this.userForm.lastName && this.userForm.email);
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getStatusColor(status: string): string {
    return status === 'active' ? '#28a745' : '#dc3545';
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'mentor': return '#007bff';
      case 'student': return '#28a745';
      default: return '#6c757d';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin': return '👑';
      case 'mentor': return '👨‍🏫';
      case 'student': return '👨‍🎓';
      default: return '👤';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
