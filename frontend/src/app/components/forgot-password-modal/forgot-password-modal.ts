import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-forgot-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password-modal.html',
  styleUrls: ['./forgot-password-modal.scss']
})
export class ForgotPasswordModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  currentStep = 1;
  userEmail = '';
  otpDigits = Array(6).fill('');
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  resendCooldown = 0;
  private destroy$ = new Subject<void>();

  emailForm: FormGroup;
  otpForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Set up OTP input handling
    this.setupOtpInputs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    
    return null;
  }

  private setupOtpInputs(): void {
    // This will be handled by the template
  }

  closeModal(): void {
    this.close.emit();
  }

  clearError(): void {
    this.errorMessage = '';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  sendOTP(): void {
    if (this.emailForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const email = this.emailForm.get('email')?.value;
      this.userEmail = email;

      this.authService.forgotPassword(email)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = 'Verification code sent to your email!';
            this.currentStep = 2;
            this.startResendCooldown();
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Send OTP error:', error);
            this.errorMessage = error.error?.message || 'Failed to send verification code. Please try again.';
          }
        });
    }
  }

  onOtpInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;

    // Only allow digits
    if (!/^\d$/.test(value) && value !== '') {
      input.value = '';
      return;
    }

    this.otpDigits[index] = value;

    // Move to next input
    if (value && index < this.otpDigits.length - 1) {
      const nextInput = input.parentElement.children[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Update form control
    this.updateOtpFormControl();
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // Handle backspace
    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        const prevInput = input.parentElement?.children[index - 1] as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      }
    }

    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = input.parentElement?.children[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }

    if (event.key === 'ArrowRight' && index < this.otpDigits.length - 1) {
      const nextInput = input.parentElement?.children[index + 1] as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    for (let i = 0; i < this.otpDigits.length; i++) {
      this.otpDigits[i] = digits[i] || '';
    }

    // Focus the last filled input or the first empty one
    const lastFilledIndex = Math.min(digits.length - 1, this.otpDigits.length - 1);
    const nextEmptyIndex = this.otpDigits.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : lastFilledIndex;

    const inputs = document.querySelectorAll('.otp-input');
    if (inputs[focusIndex]) {
      (inputs[focusIndex] as HTMLInputElement).focus();
    }

    this.updateOtpFormControl();
  }

  private updateOtpFormControl(): void {
    const otpValue = this.otpDigits.join('');
    this.otpForm.patchValue({ otp: otpValue });
  }

  verifyOTP(): void {
    if (this.otpForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const otp = this.otpForm.get('otp')?.value;

      this.authService.verifyPasswordResetOTP(this.userEmail, otp)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = 'OTP verified successfully!';
            this.currentStep = 3;
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Verify OTP error:', error);
            this.errorMessage = error.error?.message || 'Invalid OTP. Please try again.';
          }
        });
    }
  }

  resendOTP(): void {
    if (this.resendCooldown > 0) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(this.userEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'New verification code sent!';
          this.startResendCooldown();
          // Reset OTP inputs
          this.otpDigits = Array(6).fill('');
          this.otpForm.patchValue({ otp: '' });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Resend OTP error:', error);
          this.errorMessage = error.error?.message || 'Failed to resend verification code. Please try again.';
        }
      });
  }

  private startResendCooldown(): void {
    this.resendCooldown = 60; // 60 seconds cooldown
    const interval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  resetPassword(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { newPassword, confirmPassword } = this.passwordForm.value;
      const otp = this.otpForm.get('otp')?.value;

      this.authService.resetPassword(this.userEmail, otp, newPassword, confirmPassword)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.currentStep = 4;
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Reset password error:', error);
            this.errorMessage = error.error?.message || 'Failed to reset password. Please try again.';
          }
        });
    }
  }
}
