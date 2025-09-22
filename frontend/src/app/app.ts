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
    // Hide navbar on student dashboard pages
    return !url.startsWith('/student-dashboard');
  }

  onLoginClick(): void {
    this.router.navigate(['/login']);
  }
}