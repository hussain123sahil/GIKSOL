import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MentorSidebarComponent } from '../mentor-sidebar/mentor-sidebar';

@Component({
  selector: 'app-mentor-helpandsupport',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MentorSidebarComponent],
  templateUrl: './mentor-helpandsupport.html',
  styleUrls: ['./mentor-helpandsupport.scss']
})
export class MentorHelpAndSupportComponent {
  
  isSubmitting = false;
  submitMessage = '';
  submitSuccess = false;

  contactFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  faqs = [
    {
      question: "How do I set my availability for mentoring sessions?",
      answer: "Go to the 'Availability' section in your mentor sidebar. You can set your available days and time slots, and specify any breaks or holidays. Students will only be able to book sessions during your available hours.",
      expanded: false
    },
    {
      question: "How do I manage my mentor profile?",
      answer: "Navigate to 'My Profile' from the sidebar to update your professional information, expertise areas, bio, hourly rates, and profile picture. Keep your profile updated to attract more students.",
      expanded: false
    },
    {
      question: "How do I view and manage my mentoring sessions?",
      answer: "Use the 'My Sessions' section to see all your upcoming, completed, and cancelled sessions. You can add notes, cancel sessions (with proper notice), and track your session history.",
      expanded: false
    },
    {
      question: "How do I handle student cancellations?",
      answer: "When students cancel sessions, you'll be notified via email and the session will appear in your 'My Sessions' with a cancelled status. You can reschedule if needed or the slot becomes available for other bookings.",
      expanded: false
    },
    {
      question: "What are the payment terms for mentors?",
      answer: "Mentors receive payments after each completed session, typically within 3-5 business days. Payment details and earnings can be tracked in your mentor dashboard. Contact support for specific payment inquiries.",
      expanded: false
    },
    {
      question: "How do I communicate with students?",
      answer: "You can communicate with students through the platform's messaging system, during scheduled sessions, and through session notes. Always maintain professional communication standards.",
      expanded: false
    },
    {
      question: "Can I set different rates for different types of sessions?",
      answer: "Yes, you can set different hourly rates for different types of mentoring sessions (e.g., career guidance, technical skills, interview prep) in your profile settings.",
      expanded: false
    },
    {
      question: "How do I handle technical issues during sessions?",
      answer: "If you encounter technical problems during a session, try refreshing your browser first. If issues persist, contact our technical support team immediately. We'll help resolve the issue and may reschedule if necessary.",
      expanded: false
    },
    {
      question: "What if a student doesn't show up for a session?",
      answer: "If a student doesn't show up within 15 minutes of the scheduled time, you can mark the session as 'No Show' in your session management. The student will be charged, and you'll receive payment as usual.",
      expanded: false
    },
    {
      question: "How do I get feedback from students?",
      answer: "Students can rate and review your sessions after completion. You can view your ratings and feedback in your mentor dashboard. This helps improve your mentoring approach and attracts more students.",
      expanded: false
    },
    {
      question: "Can I block certain time slots or take breaks?",
      answer: "Yes, you can set breaks, holidays, or block specific time slots in your availability settings. This ensures students cannot book sessions during your unavailable times.",
      expanded: false
    },
    {
      question: "What support resources are available for mentors?",
      answer: "We provide comprehensive mentor resources including best practices guides, session templates, communication tips, and regular mentor webinars. Check your dashboard for the latest resources and updates.",
      expanded: false
    }
  ];

  constructor(
    public router: Router,
    private http: HttpClient
  ) {}

  onSubmit() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.submitMessage = '';
    
    // Submit form to backend
    this.http.post('http://localhost:5000/api/queries/submit', this.contactFormData)
      .subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.submitMessage = response.message || 'Thank you for your message! We\'ll get back to you within 24 hours.';
          
          // Reset form after successful submission
          setTimeout(() => {
            this.resetForm();
          }, 3000);
        },
        error: (error) => {
          console.error('Error submitting query:', error);
          this.isSubmitting = false;
          this.submitSuccess = false;
          this.submitMessage = error.error?.message || 'Failed to submit your message. Please try again later.';
        }
      });
  }

  resetForm(form?: NgForm) {
    this.contactFormData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    };
    
    if (form) {
      form.resetForm();
    }
    
    this.submitMessage = '';
    this.submitSuccess = false;
  }

  toggleFaq(index: number) {
    this.faqs[index].expanded = !this.faqs[index].expanded;
  }
}
