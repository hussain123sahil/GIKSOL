import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  expertise: string[];
  hourlyRate: number;
  rating: number;
  totalSessions: number;
  bio: string;
  profilePicture?: string;
  isAvailable: boolean;
}

@Component({
  selector: 'app-mentor-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './mentor-listings.html',
  styleUrls: ['./mentor-listings.scss']
})
export class MentorListingsComponent implements OnInit {
  mentors: Mentor[] = [];
  filteredMentors: Mentor[] = [];
  isLoading = true;
  
  // Search and filter properties
  searchTerm = '';
  selectedExpertise = '';
  priceRange = { min: 0, max: 200 };
  sortBy = 'rating';
  
  expertiseOptions = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Data Science',
    'Machine Learning', 'Web Development', 'Mobile Development', 'DevOps',
    'UI/UX Design', 'Product Management', 'Marketing', 'Business Strategy'
  ];

  constructor(public router: Router) {}

  ngOnInit(): void {
    this.loadMentors();
  }

  loadMentors(): void {
    // Mock data - replace with actual API call
    setTimeout(() => {
      this.mentors = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Smith',
          company: 'Google',
          expertise: ['JavaScript', 'React', 'Node.js'],
          hourlyRate: 75,
          rating: 4.9,
          totalSessions: 150,
          bio: 'Senior Software Engineer at Google with 8 years of experience in full-stack development.',
          isAvailable: true
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          company: 'Microsoft',
          expertise: ['Python', 'Data Science', 'Machine Learning'],
          hourlyRate: 90,
          rating: 4.8,
          totalSessions: 120,
          bio: 'Data Scientist and ML Engineer with expertise in Python and advanced analytics.',
          isAvailable: true
        },
        {
          id: '3',
          firstName: 'Mike',
          lastName: 'Chen',
          company: 'Amazon',
          expertise: ['Java', 'Spring Boot', 'Microservices'],
          hourlyRate: 80,
          rating: 4.7,
          totalSessions: 95,
          bio: 'Senior Backend Engineer specializing in Java and distributed systems.',
          isAvailable: true
        },
        {
          id: '4',
          firstName: 'Emily',
          lastName: 'Davis',
          company: 'Apple',
          expertise: ['iOS Development', 'Swift', 'Mobile Development'],
          hourlyRate: 85,
          rating: 4.9,
          totalSessions: 110,
          bio: 'iOS Developer with 6 years of experience building mobile applications.',
          isAvailable: false
        },
        {
          id: '5',
          firstName: 'David',
          lastName: 'Wilson',
          company: 'Netflix',
          expertise: ['DevOps', 'AWS', 'Docker'],
          hourlyRate: 70,
          rating: 4.6,
          totalSessions: 80,
          bio: 'DevOps Engineer with expertise in cloud infrastructure and automation.',
          isAvailable: true
        }
      ];
      
      this.filteredMentors = [...this.mentors];
      this.isLoading = false;
    }, 1000);
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.mentors];

    // Search filter
    if (this.searchTerm) {
      filtered = filtered.filter(mentor => 
        mentor.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        mentor.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        mentor.company.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        mentor.expertise.some(skill => 
          skill.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
    }

    // Expertise filter
    if (this.selectedExpertise) {
      filtered = filtered.filter(mentor => 
        mentor.expertise.includes(this.selectedExpertise)
      );
    }

    // Price range filter
    filtered = filtered.filter(mentor => 
      mentor.hourlyRate >= this.priceRange.min && 
      mentor.hourlyRate <= this.priceRange.max
    );

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price-low':
          return a.hourlyRate - b.hourlyRate;
        case 'price-high':
          return b.hourlyRate - a.hourlyRate;
        case 'sessions':
          return b.totalSessions - a.totalSessions;
        default:
          return 0;
      }
    });

    this.filteredMentors = filtered;
  }

  viewMentorProfile(mentorId: string): void {
    this.router.navigate(['/mentor-profile', mentorId]);
  }

  bookSession(mentorId: string): void {
    this.router.navigate(['/booking', mentorId]);
  }

  goBack(): void {
    this.router.navigate(['/student-dashboard']);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedExpertise = '';
    this.priceRange = { min: 0, max: 200 };
    this.sortBy = 'rating';
    this.applyFilters();
  }
}
