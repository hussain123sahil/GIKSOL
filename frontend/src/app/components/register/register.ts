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
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  selectedFile: File | null = null;
  filePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['student', [Validators.required]],
      bio: [''],
      skills: [''],
      // Mentor-specific fields
      company: [''],
      position: [''],
      experience: [''],
      hourlyRate: [''],
      expertise: [''],
      // Student-specific fields
      grade: [''],
      school: [''],
      learningGoals: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = this.registerForm.value;
      delete formData.confirmPassword;

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
          this.isLoading = false;
          // Navigate based on user role
          if (response.user.role === 'student') {
            this.router.navigate(['/student-dashboard']);
          } else {
            this.router.navigate(['/mentor-dashboard']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        }
      });
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
