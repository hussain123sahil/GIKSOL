import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.html',
  styleUrls: ['./admin-sidebar.scss']
})
export class AdminSidebarComponent implements OnInit {
  currentUser: any = null;
  isCollapsed = false;

  menuItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      route: '/admin',
      active: true
    },
    {
      title: 'Users',
      icon: '👥',
      route: '/admin/users',
      active: false
    },
    {
      title: 'Students',
      icon: '👨‍🎓',
      route: '/admin/students',
      active: false
    },
    {
      title: 'Mentors',
      icon: '👨‍🏫',
      route: '/admin/mentors',
      active: false
    },
    {
      title: 'Sessions',
      icon: '📅',
      route: '/admin/sessions',
      active: false
    },
    {
      title: 'Connections',
      icon: '🤝',
      route: '/admin/connections',
      active: false
    },
    {
      title: 'Reports',
      icon: '📈',
      route: '/admin/reports',
      active: false
    },
    {
      title: 'Settings',
      icon: '⚙️',
      route: '/admin/settings',
      active: false
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.updateActiveMenuItem();
  }

  updateActiveMenuItem(): void {
    const currentRoute = this.router.url;
    this.menuItems.forEach(item => {
      item.active = currentRoute === item.route;
    });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.updateActiveMenuItem();
  }

  logout(): void {
    this.authService.logout();
  }

  getInitials(): string {
    if (!this.currentUser) return 'A';
    return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`.toUpperCase();
  }
}
