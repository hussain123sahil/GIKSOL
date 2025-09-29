import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ForgotPasswordModalComponent } from '../forgot-password-modal/forgot-password-modal';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ForgotPasswordModalComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  registeredEmail = '';
  showForgotPasswordModal = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Check if user came from registration or OTP verification
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true' || params['verified'] === 'true') {
        this.registeredEmail = params['email'] || '';
        const role = params['role'] || 'user';
        const message = params['message'] || 'Account created successfully! Please log in.';
        this.successMessage = `🎉 ${message}`;
        
        // Pre-fill email if available
        if (this.registeredEmail) {
          this.loginForm.patchValue({ email: this.registeredEmail });
        }
        
        // Clear success message after 15 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 15000);
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  clearSuccess(): void {
    this.successMessage = '';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Navigate based on user role
          if (response.user.role === 'student') {
            this.router.navigate(['/student-dashboard']);
          } else if (response.user.role === 'mentor') {
            this.router.navigate(['/mentor-dashboard']);
          } else if (response.user.role === 'admin') {
            this.router.navigate(['/admin']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);
          
          // Handle different types of errors
          if (error.status === 401) {
            this.errorMessage = 'Invalid credentials. Please check your email and password.';
          } else if (error.status === 400) {
            this.errorMessage = error.error?.message || 'Invalid credentials. Please check your email and password.';
          } else if (error.status === 0) {
            this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
          } else {
            this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          }
        }
      });
    }
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }


  forgotPassword(event: Event): void {
    event.preventDefault();
    this.showForgotPasswordModal = true;
  }

  onForgotPasswordModalClose(): void {
    this.showForgotPasswordModal = false;
  }
}
