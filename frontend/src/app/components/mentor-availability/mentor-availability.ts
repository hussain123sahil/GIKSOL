import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MentorAvailabilityService } from '../../services/mentor-availability.service';
import { MentorSidebarComponent } from '../mentor-sidebar/mentor-sidebar';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface DayAvailability {
  day: string;
  key: string;
  date: string;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

export interface WeekAvailability {
  weekId: string;
  startDate: string;
  endDate: string;
  weekLabel: string;
  days: { [key: string]: DayAvailability };
}

@Component({
  selector: 'app-mentor-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MentorSidebarComponent],
  templateUrl: './mentor-availability.html',
  styleUrls: ['./mentor-availability.scss']
})
export class MentorAvailabilityComponent implements OnInit {
  currentUser: any = null;
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  successMessage: string | null = null;
  showSuccessPopup = false;

  // Days of the week
  days = [
    { name: 'Monday', key: 'monday', icon: '📅' },
    { name: 'Tuesday', key: 'tuesday', icon: '📅' },
    { name: 'Wednesday', key: 'wednesday', icon: '📅' },
    { name: 'Thursday', key: 'thursday', icon: '📅' },
    { name: 'Friday', key: 'friday', icon: '📅' },
    { name: 'Saturday', key: 'saturday', icon: '📅' },
    { name: 'Sunday', key: 'sunday', icon: '📅' }
  ];

  // Weekly availability data
  currentWeek: WeekAvailability | null = null;
  weeks: WeekAvailability[] = [];
  currentWeekIndex: number = 0;

  // Time options for dropdowns
  timeOptions: string[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private availabilityService: MentorAvailabilityService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.generateTimeOptions();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      return;
    }

    this.initializeWeeks();
    // Load availability after a small delay to ensure weeks are initialized
    setTimeout(() => {
      this.loadAvailability();
    }, 100);
  }

  initializeWeeks(): void {
    this.weeks = [];
    const today = new Date();
    
    // Generate 4 weeks: current week + 3 future weeks
    for (let i = 0; i < 4; i++) {
      const weekStart = this.getWeekStart(today, i);
      const weekEnd = this.getWeekEnd(weekStart);
      const weekId = this.generateWeekId(weekStart);
      
      const week: WeekAvailability = {
        weekId,
        startDate: this.formatDate(weekStart),
        endDate: this.formatDate(weekEnd),
        weekLabel: this.generateWeekLabel(weekStart, weekEnd),
        days: this.initializeWeekDays(weekStart)
      };
      
      this.weeks.push(week);
    }
    
    this.currentWeek = this.weeks[0];
    this.currentWeekIndex = 0;
  }

  initializeWeekDays(weekStart: Date): { [key: string]: DayAvailability } {
    const days: { [key: string]: DayAvailability } = {};
    
    this.days.forEach((day, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      
      days[day.key] = {
        day: day.name,
        key: day.key,
        date: this.formatDate(dayDate),
        isAvailable: false,
        timeSlots: []
      };
    });
    
    return days;
  }

  generateTimeOptions(): void {
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        this.timeOptions.push(timeString);
      }
    }
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getWeekStart(date: Date, weekOffset: number = 0): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff + (weekOffset * 7));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  getWeekEnd(weekStart: Date): Date {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  generateWeekId(weekStart: Date): string {
    return weekStart.toISOString().split('T')[0];
  }

  generateWeekLabel(startDate: Date, endDate: Date): string {
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const endDay = endDate.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  loadAvailability(): void {
    this.isLoading = true;
    this.error = null;

    const mentorId = this.currentUser?.id;
    if (!mentorId) {
      this.error = 'Mentor ID not found';
      this.isLoading = false;
      return;
    }

    this.availabilityService.getAvailability(mentorId).subscribe({
      next: (response: any) => {
        if (response.availability && this.currentWeek) {
          // Update current week with data from backend
          Object.keys(response.availability).forEach(dayKey => {
            if (this.currentWeek!.days[dayKey]) {
              const backendDay = response.availability[dayKey];
              
              // Update with backend data
              this.currentWeek!.days[dayKey] = {
                ...this.currentWeek!.days[dayKey],
                isAvailable: backendDay.isAvailable || false,
                timeSlots: backendDay.timeSlots && backendDay.timeSlots.length > 0 
                  ? backendDay.timeSlots.map((slot: any) => ({
                      id: slot.id || `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      startTime: slot.startTime,
                      endTime: slot.endTime,
                      isActive: slot.isActive !== undefined ? slot.isActive : true
                    }))
                  : []
              };
            }
          });
          
          // Force change detection to update the UI
          this.cdr.detectChanges();
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading availability:', error);
        this.error = error.error?.message || 'Failed to load availability settings';
        this.isLoading = false;
      }
    });
  }

  // Week navigation methods
  previousWeek(): void {
    if (this.currentWeekIndex > 0) {
      this.currentWeekIndex--;
      this.currentWeek = this.weeks[this.currentWeekIndex];
    }
  }

  nextWeek(): void {
    if (this.currentWeekIndex < this.weeks.length - 1) {
      this.currentWeekIndex++;
      this.currentWeek = this.weeks[this.currentWeekIndex];
    } else {
      // Generate next week
      this.generateNextWeek();
    }
  }

  generateNextWeek(): void {
    const lastWeek = this.weeks[this.weeks.length - 1];
    const lastWeekStart = new Date(lastWeek.startDate);
    const nextWeekStart = new Date(lastWeekStart);
    nextWeekStart.setDate(lastWeekStart.getDate() + 7);
    
    const nextWeekEnd = this.getWeekEnd(nextWeekStart);
    const weekId = this.generateWeekId(nextWeekStart);
    
    const newWeek: WeekAvailability = {
      weekId,
      startDate: this.formatDate(nextWeekStart),
      endDate: this.formatDate(nextWeekEnd),
      weekLabel: this.generateWeekLabel(nextWeekStart, nextWeekEnd),
      days: this.initializeWeekDays(nextWeekStart)
    };
    
    this.weeks.push(newWeek);
    this.currentWeekIndex = this.weeks.length - 1;
    this.currentWeek = newWeek;
  }

  goToWeek(weekIndex: number): void {
    if (weekIndex >= 0 && weekIndex < this.weeks.length) {
      this.currentWeekIndex = weekIndex;
      this.currentWeek = this.weeks[weekIndex];
    }
  }

  toggleDayAvailability(dayKey: string): void {
    if (!this.currentWeek) return;
    
    this.currentWeek.days[dayKey].isAvailable = !this.currentWeek.days[dayKey].isAvailable;
    
    // If day becomes unavailable, clear time slots
    if (!this.currentWeek.days[dayKey].isAvailable) {
      this.currentWeek.days[dayKey].timeSlots = [];
    } else {
      // If day becomes available and has no time slots, add a default one
      if (this.currentWeek.days[dayKey].timeSlots.length === 0) {
        this.currentWeek.days[dayKey].timeSlots = [{
          id: this.generateId(),
          startTime: '09:00',
          endTime: '17:00',
          isActive: true
        }];
      } else {
        // If day becomes available and has time slots, activate the first one
        this.currentWeek.days[dayKey].timeSlots[0].isActive = true;
      }
    }
  }

  addTimeSlot(dayKey: string): void {
    if (!this.currentWeek || !this.currentWeek.days[dayKey].isAvailable) {
      return;
    }

    // Get the last time slot's end time as the start time for the new slot
    const existingSlots = this.currentWeek.days[dayKey].timeSlots;
    let startTime = '09:00';
    let endTime = '17:00';

    if (existingSlots.length > 0) {
      // Use the end time of the last slot as the start time for the new slot
      const lastSlot = existingSlots[existingSlots.length - 1];
      startTime = lastSlot.endTime;
      
      // Calculate end time by adding 2 hours to start time
      const [hours, minutes] = startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + 120; // Add 2 hours
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      
      // If end time goes beyond 23:30, set it to 23:30
      if (endHours >= 23) {
        endTime = '23:30';
      }
    }

    const newSlot: TimeSlot = {
      id: this.generateId(),
      startTime: startTime,
      endTime: endTime,
      isActive: true
    };

    this.currentWeek.days[dayKey].timeSlots.push(newSlot);
  }

  removeTimeSlot(dayKey: string, slotId: string): void {
    if (!this.currentWeek) return;
    
    const day = this.currentWeek.days[dayKey];
    const slotIndex = day.timeSlots.findIndex(slot => slot.id === slotId);
    
    if (slotIndex > -1) {
      day.timeSlots.splice(slotIndex, 1);
    }

    // If no slots left and day is available, add a default slot
    if (day.timeSlots.length === 0 && day.isAvailable) {
      this.addTimeSlot(dayKey);
    }
  }

  toggleTimeSlot(dayKey: string, slotId: string): void {
    if (!this.currentWeek) return;
    
    const day = this.currentWeek.days[dayKey];
    const slot = day.timeSlots.find(s => s.id === slotId);
    
    if (slot) {
      slot.isActive = !slot.isActive;
    }
  }

  updateTimeSlot(dayKey: string, slotId: string, field: 'startTime' | 'endTime', value: string): void {
    if (!this.currentWeek) return;
    
    const day = this.currentWeek.days[dayKey];
    const slot = day.timeSlots.find(s => s.id === slotId);
    
    if (slot) {
      slot[field] = value;
      
      // Ensure end time is after start time
      if (field === 'startTime' && slot.startTime >= slot.endTime) {
        const startTime = new Date(`2000-01-01T${slot.startTime}`);
        startTime.setMinutes(startTime.getMinutes() + 30);
        slot.endTime = startTime.toTimeString().substr(0, 5);
      }
    }
  }

  saveAvailability(): void {
    this.isSaving = true;
    this.error = null;
    this.successMessage = null;

    // Validate availability
    const validation = this.validateAvailability();
    if (!validation.isValid) {
      this.error = validation.message;
      this.isSaving = false;
      return;
    }

    // Prepare data for backend
    const availabilityData = this.prepareAvailabilityData();
    const mentorId = this.currentUser?.id;

    if (!mentorId) {
      this.error = 'Mentor ID not found';
      this.isSaving = false;
      return;
    }

    this.availabilityService.updateAvailability(mentorId, availabilityData).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.showSuccessPopup = true;
        
        // Hide popup after 3 seconds
        setTimeout(() => {
          this.showSuccessPopup = false;
        }, 3000);
      },
      error: (error) => {
        this.isSaving = false;
        this.error = error.error?.message || error.message || 'Failed to update availability. Please try again.';
      }
    });
  }

  validateAvailability(): { isValid: boolean; message: string } {
    if (!this.currentWeek) {
      return { isValid: false, message: 'No week selected.' };
    }

    // Check if at least one day is available
    const hasAvailableDay = Object.values(this.currentWeek.days).some(day => day.isAvailable);
    if (!hasAvailableDay) {
      return { isValid: false, message: 'Please set availability for at least one day.' };
    }

    // Check if each available day has at least one active time slot
    for (const day of Object.values(this.currentWeek.days)) {
      if (day.isAvailable) {
        const hasActiveSlot = day.timeSlots.some(slot => slot.isActive);
        if (!hasActiveSlot) {
          return { isValid: false, message: `Please add at least one time slot for ${day.day}.` };
        }

        // Check if time slots are valid
        for (const slot of day.timeSlots) {
          if (slot.isActive && slot.startTime >= slot.endTime) {
            return { isValid: false, message: `End time must be after start time for ${day.day}.` };
          }
        }
      }
    }

    return { isValid: true, message: '' };
  }

  prepareAvailabilityData(): any {
    if (!this.currentWeek) return {};

    const data: any = {};
    
    Object.entries(this.currentWeek.days).forEach(([dayKey, day]) => {
      data[dayKey] = {
        isAvailable: day.isAvailable,
        timeSlots: day.timeSlots
          .filter(slot => slot.isActive)
          .map(slot => ({
            id: slot.id || `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive
          }))
      };
    });

    return data;
  }

  getActiveSlotsCount(dayKey: string): number {
    if (!this.currentWeek) return 0;
    return this.currentWeek.days[dayKey].timeSlots.filter(slot => slot.isActive).length;
  }

  getTotalActiveSlots(): number {
    if (!this.currentWeek) return 0;
    return Object.values(this.currentWeek.days)
      .reduce((total, day) => total + this.getActiveSlotsCount(day.key), 0);
  }

  getAvailableDaysCount(): number {
    if (!this.currentWeek) return 0;
    return this.days.filter(d => this.currentWeek!.days[d.key].isAvailable).length;
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }


  closeSuccessPopup(): void {
    this.showSuccessPopup = false;
  }
}
