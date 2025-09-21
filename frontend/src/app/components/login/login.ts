import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  clearError(): void {
    this.errorMessage = '';
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
          } else {
            this.router.navigate(['/mentor-dashboard']);
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

  loginWithGoogle(): void {
    // For now, simulate Google login with demo data
    // In a real application, you would integrate with Google OAuth
    const googleData = {
      googleId: 'demo-google-id-' + Date.now(),
      email: 'demo@google.com',
      firstName: 'Google',
      lastName: 'User',
      profilePicture: 'https://via.placeholder.com/150/667eea/ffffff?text=G'
    };

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.googleLogin(googleData).subscribe({
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
        this.errorMessage = error.error?.message || 'Google login failed. Please try again.';
        setTimeout(() => {
          this.errorMessage = '';
        }, 4000);
      }
    });
  }

  forgotPassword(event: Event): void {
    event.preventDefault();
    
    // Get email from form
    const email = this.loginForm.get('email')?.value;
    
    if (!email) {
      this.errorMessage = 'Please enter your email address first.';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
      return;
    }

    // Call forgot password API
    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.errorMessage = '';
        // Show success message
        this.errorMessage = `Password reset instructions sent to ${email}. Check your email for further instructions.`;
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to send reset instructions. Please try again.';
        setTimeout(() => {
          this.errorMessage = '';
        }, 4000);
      }
    });
  }
}
