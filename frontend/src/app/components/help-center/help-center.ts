import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help-center.html',
  styleUrls: ['./help-center.scss']
})
export class HelpCenterComponent {
  
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
      question: "How does the mentoring process work?",
      answer: "Students can browse mentor profiles, send connection requests, and once accepted, schedule mentoring sessions. Mentors can set their availability and rates. The platform facilitates secure communication and session management.",
      expanded: false
    },
    {
      question: "What are the fees for mentoring sessions?",
      answer: "Mentoring fees vary by mentor and are clearly displayed on their profiles. Students can choose mentors based on their budget and needs. Payment is processed securely through our platform.",
      expanded: false
    },
    {
      question: "How do I become a mentor?",
      answer: "Register as a mentor, complete your profile with expertise areas, set your rates and availability, and upload proof of qualifications. Once approved by our team, you can start accepting students.",
      expanded: false
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we use industry-standard security measures to protect your data. All communications are encrypted and your personal information is never shared without consent. We comply with GDPR and other privacy regulations.",
      expanded: false
    },
    {
      question: "How do I schedule a mentoring session?",
      answer: "Once connected with a mentor, you can view their availability calendar and book sessions directly through the platform. You'll receive confirmation emails and calendar invites for all scheduled sessions.",
      expanded: false
    },
    {
      question: "What if I need to cancel or reschedule a session?",
      answer: "You can cancel or reschedule sessions up to 24 hours before the scheduled time through your dashboard. Cancellations within 24 hours may be subject to the mentor's cancellation policy.",
      expanded: false
    },
    {
      question: "How do I contact support?",
      answer: "You can reach our support team via email at support@giksol.com, phone at +1 (555) 123-4567, or through the contact form on this page. We typically respond within 24 hours.",
      expanded: false
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through our payment partners. You can manage your payment methods in your account settings.",
      expanded: false
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "We offer a satisfaction guarantee. If you're not satisfied with a mentoring session, contact our support team within 48 hours and we'll work with you to resolve the issue or provide a refund.",
      expanded: false
    },
    {
      question: "How do I update my profile information?",
      answer: "You can update your profile information at any time by logging into your account and going to the 'Profile' section. Changes are saved automatically and will be reflected immediately.",
      expanded: false
    }
  ];

  toggleFaq(index: number): void {
    this.faqs[index].expanded = !this.faqs[index].expanded;
  }

  onSubmit(): void {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.submitMessage = '';
    
    // Simulate form submission
    setTimeout(() => {
      console.log('Form submitted:', this.contactFormData);
      
      // Simulate success response
      this.submitSuccess = true;
      this.submitMessage = 'Thank you for your message! We have received your inquiry and will get back to you within 24 hours.';
      
      this.isSubmitting = false;
      
      // Clear the success message after 5 seconds
      setTimeout(() => {
        this.submitMessage = '';
      }, 5000);
      
    }, 2000);
  }

  resetForm(form: NgForm): void {
    form.resetForm();
    this.contactFormData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      newsletter: false
    };
    this.submitMessage = '';
  }
}
