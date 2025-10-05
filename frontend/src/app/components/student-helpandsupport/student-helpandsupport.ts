import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-student-helpandsupport',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, SidebarComponent],
  templateUrl: './student-helpandsupport.html',
  styleUrls: ['./student-helpandsupport.scss']
})
export class StudentHelpAndSupportComponent {
  
  isSubmitting = false;
  submitMessage = '';
  submitSuccess = false;

  contactFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    newsletter: false
  };

  faqs = [
    {
      question: "How do I book a mentoring session?",
      answer: "To book a session, go to the 'Find Mentors' page, browse available mentors, click on a mentor's profile, and use the 'Book Session' button. You can select your preferred date, time, and session type.",
      expanded: false
    },
    {
      question: "How do I connect with a mentor?",
      answer: "You can send connection requests to mentors by visiting their profiles and clicking 'Connect'. Once they accept your request, you can book sessions and communicate with them directly.",
      expanded: false
    },
    {
      question: "What are the fees for mentoring sessions?",
      answer: "Mentoring fees vary by mentor and are clearly displayed on their profiles. You can choose mentors based on your budget and needs. Payment is processed securely through our platform.",
      expanded: false
    },
    {
      question: "How do I update my student profile?",
      answer: "Go to your account settings from the sidebar, then click on 'Profile'. You can update your personal information, learning goals, interests, and other profile details.",
      expanded: false
    },
    {
      question: "How do I view my upcoming sessions?",
      answer: "You can view all your sessions in the 'My Sessions' section from the sidebar. This shows your upcoming, completed, and cancelled sessions with details about each one.",
      expanded: false
    },
    {
      question: "Can I cancel a session?",
      answer: "Yes, you can cancel sessions up to 24 hours before the scheduled time. Go to 'My Sessions', find the session you want to cancel, and click the 'Cancel' button.",
      expanded: false
    },
    {
      question: "How do I change my password?",
      answer: "Go to your account settings, then click on 'Security'. You can change your password by entering your current password and setting a new one.",
      expanded: false
    },
    {
      question: "What if I have technical issues?",
      answer: "If you're experiencing technical problems, try refreshing the page first. If the issue persists, contact our support team through the contact form or email support@giksol.com.",
      expanded: false
    },
    {
      question: "How do I rate a mentor after a session?",
      answer: "After a session is completed, you'll see a 'Rate Session' option in your 'My Sessions' page. Click on it to provide feedback and rate your experience with the mentor.",
      expanded: false
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we use industry-standard security measures to protect your data. All communications are encrypted and your personal information is never shared without consent. We comply with GDPR and other privacy regulations.",
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
      message: '',
      newsletter: false
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
