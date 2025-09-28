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
  private isTyping = false;
  private destroy$ = new Subject<void>();
  private lastProcessedValue = '';
  private lastProcessedIndex = -1;
  private verifiedOTP = ''; // Store the verified OTP

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

  trackByIndex(index: number, item: any): number {
    return index;
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
    // Reset all state when closing modal
    this.currentStep = 1;
    this.userEmail = '';
    this.verifiedOTP = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.clearOtpInputs();
    this.emailForm.reset();
    this.otpForm.reset();
    this.passwordForm.reset();
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
      
      // Clear any previous verified OTP when starting new flow
      this.verifiedOTP = '';

      this.authService.forgotPassword(email)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = 'Verification code sent to your email!';
            this.currentStep = 2;
            this.startResendCooldown();
            // Focus first OTP input after a short delay
            setTimeout(() => {
              this.focusFirstOtpInput();
            }, 100);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Send OTP error:', error);
            this.errorMessage = error.error?.message || 'Failed to send verification code. Please try again.';
          }
        });
    }
  }

  private focusFirstOtpInput(): void {
    const firstInput = document.querySelector('.otp-input') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }
  }

  onOtpInput(event: any, index: number): void {
    const input = event.target;
    let value = input.value;

    // Prevent duplicate processing by checking if this is the same value and index
    if (value === this.lastProcessedValue && index === this.lastProcessedIndex) {
      return;
    }

    // Only allow single digit
    if (!/^\d$/.test(value)) {
      this.otpDigits[index] = '';
      this.updateOtpFormControl();
      this.lastProcessedValue = '';
      this.lastProcessedIndex = index;
      return;
    }

    // Update the digit
    this.otpDigits[index] = value;
    this.lastProcessedValue = value;
    this.lastProcessedIndex = index;

    // Update form control
    this.updateOtpFormControl();

    // Move to next input
    if (value && index < this.otpDigits.length - 1) {
      const nextInput = input.parentElement?.children[index + 1] as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onOtpFocus(event: any, index: number): void {
    const input = event.target;
    // Select all text when focusing
    input.select();
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

    // Update all digits
    for (let i = 0; i < this.otpDigits.length; i++) {
      this.otpDigits[i] = digits[i] || '';
    }

    // Reset tracking variables
    this.lastProcessedValue = '';
    this.lastProcessedIndex = -1;

    this.updateOtpFormControl();

    // Focus the last filled input
    const lastFilledIndex = Math.min(digits.length - 1, this.otpDigits.length - 1);
    const inputs = document.querySelectorAll('.otp-input');
    if (inputs[lastFilledIndex]) {
      (inputs[lastFilledIndex] as HTMLInputElement).focus();
    }
  }

  private updateOtpFormControl(): void {
    const otpValue = this.otpDigits.join('');
    this.otpForm.patchValue({ otp: otpValue });
    
    // Auto-submit when all 6 digits are entered and user is not actively typing
    if (otpValue.length === 6 && !this.isTyping) {
      setTimeout(() => {
        if (this.otpForm.valid && !this.isLoading) {
          this.verifyOTP();
        }
      }, 300);
    }
  }

  verifyOTP(): void {
    console.log('Verifying OTP...', {
      formValid: this.otpForm.valid,
      otpValue: this.otpForm.get('otp')?.value,
      otpDigits: this.otpDigits,
      userEmail: this.userEmail
    });

    if (this.otpForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const otp = this.otpForm.get('otp')?.value;

      this.authService.verifyPasswordResetOTP(this.userEmail, otp)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('OTP verification successful:', response);
            this.isLoading = false;
            this.successMessage = 'OTP verified successfully!';
            this.verifiedOTP = otp; // Store the verified OTP
            this.currentStep = 3;
          },
          error: (error) => {
            console.error('Verify OTP error:', error);
            this.isLoading = false;
            this.errorMessage = error.error?.message || 'Invalid OTP. Please try again.';
          }
        });
    } else {
      console.log('Form validation failed:', this.otpForm.errors);
      this.errorMessage = 'Please enter a valid 6-digit OTP.';
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
          this.clearOtpInputs();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Resend OTP error:', error);
          this.errorMessage = error.error?.message || 'Failed to resend verification code. Please try again.';
        }
      });
  }

  private clearOtpInputs(): void {
    this.otpDigits = Array(6).fill('');
    this.otpForm.patchValue({ otp: '' });
    this.otpForm.markAsUntouched();
    this.otpForm.markAsPristine();
    
    // Reset tracking variables
    this.lastProcessedValue = '';
    this.lastProcessedIndex = -1;
    
    // Clear all input values
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach((input) => {
      (input as HTMLInputElement).value = '';
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
      const otp = this.verifiedOTP || this.otpForm.get('otp')?.value; // Use verified OTP if available

      console.log('Reset password - OTP being used:', otp);
      console.log('Reset password - Verified OTP stored:', this.verifiedOTP);
      console.log('Reset password - Form OTP value:', this.otpForm.get('otp')?.value);

      this.authService.resetPassword(this.userEmail, otp, newPassword, confirmPassword)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = 'Password reset successfully!';
            this.currentStep = 4;
            // Clear the verified OTP and reset forms after successful reset
            this.verifiedOTP = '';
            this.clearOtpInputs();
            this.passwordForm.reset();
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
