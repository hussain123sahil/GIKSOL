import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { MentorService, Mentor } from '../../services/mentor';

interface MentorDisplay {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  expertise: string[];
  hourlyRate: number;
  rating: number;
  totalSessions: number;
  bio: string;
  profilePicture: string;
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
  mentors: MentorDisplay[] = [];
  filteredMentors: MentorDisplay[] = [];
  paginatedMentors: MentorDisplay[] = [];
  isLoading = true;
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;
  
  // Search and filter properties
  searchTerm = '';
  selectedExpertise = '';
  selectedCompany = '';
  priceRange = { min: 0, max: 200 };
  sortBy = 'rating';
  
  // Company filters
  companyFilters = ['UKG', 'Infosys', 'TCS', 'Microsoft'];
  
  // Mentor previews for hero section
  previewMentors = [
    {
      name: 'John Smith',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      name: 'Mike Chen',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      name: 'David Wilson',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    }
  ];
  
  expertiseOptions = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Data Science',
    'Machine Learning', 'Web Development', 'Mobile Development', 'DevOps',
    'UI/UX Design', 'Product Management', 'Marketing', 'Business Strategy'
  ];

  constructor(public router: Router, private mentorService: MentorService) {}

  ngOnInit(): void {
    this.loadMentors();
  }

  loadMentors(): void {
    this.isLoading = true;
    
    this.mentorService.getAllMentors().subscribe({
      next: (mentors: Mentor[]) => {
        // Transform backend mentor data to display format
        this.mentors = mentors.map(mentor => ({
          id: mentor._id,
          firstName: mentor.user.firstName,
          lastName: mentor.user.lastName,
          title: mentor.position,
          company: mentor.company,
          expertise: mentor.expertise,
          hourlyRate: mentor.hourlyRate,
          rating: Math.round(mentor.rating * 10) / 10, // Round to 1 decimal place
          totalSessions: mentor.totalSessions,
          bio: mentor.bio,
          profilePicture: mentor.user.profilePicture || this.getDefaultProfilePicture(mentor.user.firstName, mentor.user.lastName),
          isAvailable: mentor.isAvailable
        }));
        
        this.filteredMentors = [...this.mentors];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading mentors:', error);
        this.isLoading = false;
        // Fallback to mock data if API fails
        this.loadMockMentors();
      }
    });
  }

  private loadMockMentors(): void {
    // Fallback mock data
    this.mentors = [
      {
        id: '1',
        firstName: 'Dr. Anya',
        lastName: 'Sharna',
        title: 'AI Ethics Researcher',
        company: 'Google',
        expertise: ['AI Ethics', 'Machine Learning', 'Research'],
        hourlyRate: 120,
        rating: 4.5,
        totalSessions: 85,
        bio: 'Leading AI ethics researcher with expertise in responsible AI development.',
        profilePicture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
        isAvailable: true
      },
      {
        id: '2',
        firstName: 'Mark',
        lastName: 'Chen',
        title: 'Senior Product Manager',
        company: 'Microsoft',
        expertise: ['Product Management', 'Strategy', 'Leadership'],
        hourlyRate: 100,
        rating: 4.5,
        totalSessions: 120,
        bio: 'Experienced product manager with a track record of successful product launches.',
        profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
        isAvailable: true
      }
    ];
    
    this.filteredMentors = [...this.mentors];
    this.updatePagination();
  }

  private getDefaultProfilePicture(firstName: string, lastName: string): string {
    // Generate a default profile picture based on name initials
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=4f46e5&color=ffffff&size=200&bold=true`;
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
    this.currentPage = 1;
    this.updatePagination();
  }

  viewMentorProfile(mentorId: string): void {
    this.router.navigate(['/mentor-profile', mentorId]);
  }

  bookSession(mentorId: string): void {
    this.router.navigate(['/booking', mentorId]);
  }

  selectCompany(company: string): void {
    this.selectedCompany = this.selectedCompany === company ? '' : company;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedExpertise = '';
    this.selectedCompany = '';
    this.priceRange = { min: 0, max: 200 };
    this.sortBy = 'rating';
    this.applyFilters();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredMentors.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedMentors = this.filteredMentors.slice(startIndex, endIndex);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total);
      }
    }

    return pages;
  }

  getStars(rating: number): { filled: boolean; half: boolean }[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push({ filled: true, half: false });
      } else if (i === fullStars && hasHalfStar) {
        stars.push({ filled: false, half: true });
      } else {
        stars.push({ filled: false, half: false });
      }
    }

    return stars;
  }

  getCompanyLogo(company: string): string {
    const logoMap: { [key: string]: string } = {
      'Google': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
      'Microsoft': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
      'JP Morgan': 'https://ui-avatars.com/api/?name=JP&background=1a365d&color=ffffff&size=24&bold=true',
      'Nike': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
      'Harvard': 'https://ui-avatars.com/api/?name=H&background=8b0000&color=ffffff&size=24&bold=true',
      'Apple': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
      'Spotify': 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
      'Tesla': 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Tesla_T_symbol.svg',
      'Netflix': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg'
    };
    
    return logoMap[company] || 'https://ui-avatars.com/api/?name=?&background=cccccc&color=666666&size=24&bold=true';
  }
}
