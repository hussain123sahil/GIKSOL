import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth';

interface PendingMentor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  experience: number;
  expertise: string[];
  hourlyRate: number;
  bio: string;
  proofDocument?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PendingStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  grade: string;
  learningGoals: string[];
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss']
})
export class AdminComponent implements OnInit {
  currentUser: User | null = null;
  pendingMentors: PendingMentor[] = [];
  pendingStudents: PendingStudent[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // In a real app, check if user is admin
    this.loadAdminData();
  }

  loadAdminData(): void {
    // Mock data - replace with actual API calls
    setTimeout(() => {
      this.pendingMentors = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@email.com',
          company: 'Tech Corp',
          position: 'Senior Developer',
          experience: 8,
          expertise: ['JavaScript', 'React', 'Node.js'],
          hourlyRate: 80,
          bio: 'Experienced full-stack developer with expertise in modern web technologies.',
          proofDocument: 'certificate.pdf',
          submittedAt: '2024-01-20',
          status: 'pending'
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@email.com',
          company: 'Data Solutions',
          position: 'Data Scientist',
          experience: 6,
          expertise: ['Python', 'Machine Learning', 'Data Analysis'],
          hourlyRate: 90,
          bio: 'Data scientist with extensive experience in machine learning and analytics.',
          proofDocument: 'degree.pdf',
          submittedAt: '2024-01-22',
          status: 'pending'
        }
      ];

      this.pendingStudents = [
        {
          id: '1',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice.johnson@email.com',
          school: 'Stanford University',
          grade: 'Sophomore',
          learningGoals: ['Web Development', 'React', 'JavaScript'],
          submittedAt: '2024-01-21',
          status: 'pending'
        }
      ];

      this.isLoading = false;
    }, 1000);
  }

  approveMentor(mentorId: string): void {
    // Implement approve mentor logic
    console.log('Approve mentor:', mentorId);
    // Update status in UI
    const mentor = this.pendingMentors.find(m => m.id === mentorId);
    if (mentor) {
      mentor.status = 'approved';
    }
  }

  rejectMentor(mentorId: string): void {
    // Implement reject mentor logic
    console.log('Reject mentor:', mentorId);
    // Update status in UI
    const mentor = this.pendingMentors.find(m => m.id === mentorId);
    if (mentor) {
      mentor.status = 'rejected';
    }
  }

  approveStudent(studentId: string): void {
    // Implement approve student logic
    console.log('Approve student:', studentId);
    // Update status in UI
    const student = this.pendingStudents.find(s => s.id === studentId);
    if (student) {
      student.status = 'approved';
    }
  }

  rejectStudent(studentId: string): void {
    // Implement reject student logic
    console.log('Reject student:', studentId);
    // Update status in UI
    const student = this.pendingStudents.find(s => s.id === studentId);
    if (student) {
      student.status = 'rejected';
    }
  }

  viewDocument(documentName: string): void {
    // Implement document viewing logic
    console.log('View document:', documentName);
  }

  logout(): void {
    this.authService.logout();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'approved': return '#2e7d32';
      case 'rejected': return '#d32f2f';
      default: return '#666';
    }
  }

  get documentsToReviewCount(): number {
    return this.pendingMentors.filter(m => m.proofDocument).length;
  }

  get approvedTodayCount(): number {
    return this.pendingMentors.filter(m => m.status === 'approved').length + 
           this.pendingStudents.filter(s => s.status === 'approved').length;
  }
}
