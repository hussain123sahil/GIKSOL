import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  selectedFile: File | null = null;
  filePreview: string | null = null;
  selectedRole: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }

  initializeForm() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['', [Validators.required]],
      bio: [''],
      skills: [''],
      // Mentor-specific fields
      company: [''],
      position: [''],
      experience: [''],
      hourlyRate: [''],
      expertise: [''],
      linkedinUrl: ['', [Validators.pattern(/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/)]],
      // Student-specific fields
      grade: [''],
      school: [''],
      learningGoals: ['']
    }, { validators: this.passwordMatchValidator });
  }

  selectRole(role: string): void {
    this.selectedRole = role;
    this.registerForm.patchValue({ role: role });
    
    // Set validation based on role
    if (role === 'mentor') {
      this.registerForm.get('company')?.setValidators([Validators.required]);
      this.registerForm.get('position')?.setValidators([Validators.required]);
      this.registerForm.get('experience')?.setValidators([Validators.required, Validators.min(0)]);
      this.registerForm.get('hourlyRate')?.setValidators([Validators.required, Validators.min(0)]);
      this.registerForm.get('expertise')?.setValidators([Validators.required]);
      this.registerForm.get('grade')?.clearValidators();
      this.registerForm.get('school')?.clearValidators();
      this.registerForm.get('learningGoals')?.clearValidators();
    } else if (role === 'student') {
      this.registerForm.get('grade')?.setValidators([Validators.required]);
      this.registerForm.get('school')?.setValidators([Validators.required]);
      this.registerForm.get('learningGoals')?.setValidators([Validators.required]);
      this.registerForm.get('company')?.clearValidators();
      this.registerForm.get('position')?.clearValidators();
      this.registerForm.get('experience')?.clearValidators();
      this.registerForm.get('hourlyRate')?.clearValidators();
      this.registerForm.get('expertise')?.clearValidators();
    }
    
    // Update validation for all fields
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.updateValueAndValidity();
    });
  }

  goBackToRoleSelection(): void {
    this.selectedRole = null;
    this.registerForm.reset();
    this.initializeForm();
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmPassword?.hasError('passwordMismatch')) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = this.registerForm.value;
      delete formData.confirmPassword;
      
      console.log('Sending registration data:', formData);

      // Convert skills string to array
      if (formData.skills) {
        formData.skills = formData.skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill);
      }

      // Convert expertise string to array for mentors
      if (formData.expertise) {
        formData.expertise = formData.expertise.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill);
      }

      // Convert learning goals string to array for students
      if (formData.learningGoals) {
        formData.learningGoals = formData.learningGoals.split(',').map((goal: string) => goal.trim()).filter((goal: string) => goal);
      }

      // Add file data if mentor uploaded proof
      if (this.selectedFile && formData.role === 'mentor') {
        formData.proofDocument = this.selectedFile.name; // In real app, upload file to server
      }

      this.authService.register(formData).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.isLoading = false;
          // Navigate directly to login page with success message
          this.router.navigate(['/login'], { 
            queryParams: { 
              registered: 'true', 
              role: response.user.role,
              email: response.user.email 
            } 
          });
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        }
      });
    } else {
      console.log('Form is invalid, cannot submit');
      // Mark all fields as touched to show validation errors
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields correctly.';
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.filePreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.filePreview = null;
      }
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.filePreview = null;
  }

  get isMentor(): boolean {
    return this.registerForm.get('role')?.value === 'mentor';
  }

  get isStudent(): boolean {
    return this.registerForm.get('role')?.value === 'student';
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
