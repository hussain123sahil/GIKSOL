import { Component, EventEmitter, Input, Output } from '@angular/core';
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
export class EditMentorProfileModalComponent {
  @Input() isVisible = false;
  @Input() profileData: MentorProfile = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    position: '',
    expertise: [],
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

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
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
      degree: '',
      institution: '',
      year: new Date().getFullYear()
    });
  }

  removeEducation(index: number): void {
    this.profileData.education.splice(index, 1);
  }

  // Experience methods
  addExperience(): void {
    this.profileData.experience.push({
      company: '',
      position: '',
      startDate: '',
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
      name: '',
      issuer: '',
      date: ''
    });
  }

  removeCertification(index: number): void {
    this.profileData.certifications.splice(index, 1);
  }

  // Helper method to get current year
  getCurrentYear(): number {
    return new Date().getFullYear();
  }
}
