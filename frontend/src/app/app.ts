import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'MentorConnect - Student-Mentor Platform';

  constructor(private router: Router) {}

  get showNavbar(): boolean {
    const url = this.router.url || '';
    // Hide navbar on dashboard pages and mentor listings (logged in users have sidebar)
    return !url.startsWith('/student-dashboard') && 
           !url.startsWith('/mentor-dashboard') && 
           !url.startsWith('/mentors') && 
           !url.startsWith('/booking');
  }

  onLoginClick(): void {
    this.router.navigate(['/login']);
  }
}