import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent {
  constructor(private router: Router) {
    console.log('HomeComponent loaded!');
  }

  faqs = [
    {
      question: "How does the mentoring process work?",
      answer: "Students can browse mentor profiles, send connection requests, and once accepted, schedule mentoring sessions. Mentors can set their availability and rates.",
      expanded: false
    },
    {
      question: "What are the fees for mentoring sessions?",
      answer: "Mentoring fees vary by mentor and are clearly displayed on their profiles. Students can choose mentors based on their budget and needs.",
      expanded: false
    },
    {
      question: "How do I become a mentor?",
      answer: "Register as a mentor, complete your profile with expertise areas, set your rates and availability, and upload proof of qualifications. Once approved, you can start accepting students.",
      expanded: false
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we use industry-standard security measures to protect your data. All communications are encrypted and your personal information is never shared without consent.",
      expanded: false
    }
  ];

  testimonials = [
    {
      name: "Sarah Johnson",
      role: "Computer Science Student",
      text: "The mentoring platform helped me land my dream internship. My mentor provided invaluable guidance on technical interviews and career planning.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      text: "Mentoring students has been incredibly rewarding. It's great to give back to the community while helping the next generation of developers.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Data Science Student",
      text: "I found the perfect mentor for my machine learning journey. The structured sessions and personalized guidance made all the difference.",
      rating: 5
    }
  ];

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  toggleFaq(index: number): void {
    this.faqs[index].expanded = !this.faqs[index].expanded;
  }
}
