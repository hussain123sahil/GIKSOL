import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-features',
  templateUrl: './features.html',
  styleUrls: ['./features.scss']
})
export class FeaturesComponent {

  constructor(private router: Router) {}

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToMentors() {
    this.router.navigate(['/mentors']);
  }
}
