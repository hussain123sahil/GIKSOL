import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent {
  @Output() loginClick = new EventEmitter<void>();

  constructor(private router: Router) {}

  onLoginClick(): void {
    this.loginClick.emit();
    // Navigate to login page
    this.router.navigate(['/login']);
  }

  onNavLinkClick(route: string): void {
    this.router.navigate([route]);
  }
}



