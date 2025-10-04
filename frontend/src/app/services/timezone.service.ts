import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  private readonly IST_TIMEZONE = 'Asia/Kolkata';
  private readonly IST_DISPLAY = 'IST';

  constructor() { }

  /**
   * Convert a date to IST timezone
   */
  toIST(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Date(dateObj.toLocaleString('en-US', { timeZone: this.IST_TIMEZONE }));
  }

  /**
   * Format date in IST for display
   */
  formatDateIST(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: this.IST_TIMEZONE
    };
    
    return dateObj.toLocaleDateString('en-IN', { ...defaultOptions, ...options });
  }

  /**
   * Format time in IST for display
   */
  formatTimeIST(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.IST_TIMEZONE,
      timeZoneName: 'short'
    };
    
    return dateObj.toLocaleTimeString('en-IN', { ...defaultOptions, ...options });
  }

  /**
   * Format date and time in IST for display
   */
  formatDateTimeIST(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.IST_TIMEZONE,
      timeZoneName: 'short'
    };
    
    return dateObj.toLocaleString('en-IN', { ...defaultOptions, ...options });
  }

  /**
   * Get current date/time in IST
   */
  getCurrentIST(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: this.IST_TIMEZONE }));
  }

  /**
   * Create a date string for form inputs (YYYY-MM-DD) in IST
   */
  getDateStringIST(date?: Date | string): string {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
    return dateObj.toLocaleDateString('en-CA', { timeZone: this.IST_TIMEZONE });
  }

  /**
   * Create a time string for form inputs (HH:MM) in IST
   */
  getTimeStringIST(date?: Date | string): string {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
    return dateObj.toLocaleTimeString('en-GB', { 
      timeZone: this.IST_TIMEZONE,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Create ISO string for API calls, ensuring it represents IST time
   */
  createISOStringIST(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Convert to IST first, then create ISO string
    const istDate = new Date(dateObj.toLocaleString('en-US', { timeZone: this.IST_TIMEZONE }));
    return istDate.toISOString();
  }

  /**
   * Get timezone display name
   */
  getTimezoneDisplay(): string {
    return this.IST_DISPLAY;
  }

  /**
   * Get timezone identifier
   */
  getTimezone(): string {
    return this.IST_TIMEZONE;
  }
}
