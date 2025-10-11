import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MentorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  company: string;
  position: string;
  expertise: string[];
  hourlyRate: number;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  website?: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

@Component({
  selector: 'app-edit-mentor-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-mentor-profile-modal.html',
  styleUrls: ['./edit-mentor-profile-modal.scss']
})
export class EditMentorProfileModalComponent implements OnChanges {
  @Input() isVisible = false;
  @Input() profileData: MentorProfile = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    profilePicture: '',
    company: '',
    position: '',
    expertise: [],
    hourlyRate: 0,
    bio: '',
    linkedinUrl: '',
    githubUrl: '',
    website: '',
    experience: [],
    education: [],
    certifications: []
  };
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<MentorProfile>();
  
  newExpertise = '';
  isSubmitting = false;
  profilePictureError = '';

  ngOnChanges(): void {
    // Reset submitting state when modal becomes visible
    if (this.isVisible) {
      this.isSubmitting = false;
    }
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.isSubmitting = false; // Reset submitting state when closing
    this.close.emit();
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      this.isSubmitting = true;
      this.save.emit({ ...this.profileData });
    }
  }

  isFormValid(): boolean {
    return !!(
      this.profileData.firstName?.trim() &&
      this.profileData.lastName?.trim() &&
      this.profileData.email?.trim() &&
      this.profileData.company?.trim() &&
      this.profileData.position?.trim() &&
      this.profileData.expertise.length > 0
    );
  }

  addExpertise(event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    
    if (value && !this.profileData.expertise.includes(value)) {
      this.profileData.expertise.push(value);
      this.newExpertise = '';
    }
  }

  removeExpertise(index: number): void {
    this.profileData.expertise.splice(index, 1);
  }

  // Education methods
  addEducation(): void {
    this.profileData.education.push({
      degree: 'Degree Name',
      institution: 'Institution Name',
      year: new Date().getFullYear()
    });
  }

  removeEducation(index: number): void {
    this.profileData.education.splice(index, 1);
  }

  // Experience methods
  addExperience(): void {
    this.profileData.experience.push({
      company: 'Company Name',
      position: 'Position Title',
      startDate: '2020-01-01',
      endDate: '',
      description: ''
    });
  }

  removeExperience(index: number): void {
    this.profileData.experience.splice(index, 1);
  }

  // Certification methods
  addCertification(): void {
    this.profileData.certifications.push({
      name: 'Certification Name',
      issuer: 'Issuing Organization',
      date: new Date().getFullYear().toString()
    });
  }

  removeCertification(index: number): void {
    this.profileData.certifications.splice(index, 1);
  }

  // Helper method to get current year
  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  // Profile picture methods
  onProfilePictureChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Clear previous error
    this.profilePictureError = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.profilePictureError = 'Please select an image file only';
      return;
    }

    // Validate file size (30KB - 100KB)
    const fileSizeKB = file.size / 1024;
    if (fileSizeKB < 30) {
      this.profilePictureError = 'Image size must be at least 30KB';
      return;
    }
    if (fileSizeKB > 100) {
      this.profilePictureError = 'Image size must not exceed 100KB';
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profileData.profilePicture = e.target.result;
    };
    reader.onerror = () => {
      this.profilePictureError = 'Error reading the image file';
    };
    reader.readAsDataURL(file);
  }

  removeProfilePicture(): void {
    this.profileData.profilePicture = '';
    this.profilePictureError = '';
  }
}
