import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { MentorListingsComponent } from './components/mentor-listings/mentor-listings';
import { MentorProfileComponent } from './components/mentor-profile/mentor-profile';
import { BookingComponent } from './components/booking/booking';
import { StudentDashboardComponent } from './components/student-dashboard/student-dashboard';
import { MentorDashboardComponent } from './components/mentor-dashboard/mentor-dashboard';
import { AdminComponent } from './components/admin/admin';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'mentors', component: MentorListingsComponent },
  { path: 'mentor-profile/:id', component: MentorProfileComponent },
  { path: 'booking/:mentorId', component: BookingComponent },
  { path: 'student-dashboard', component: StudentDashboardComponent },
  { path: 'mentor-dashboard', component: MentorDashboardComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];