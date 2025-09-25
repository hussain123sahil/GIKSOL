import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mentor-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mentor-sidebar.html',
  styleUrls: ['./mentor-sidebar.scss']
})
export class MentorSidebarComponent {
  @Output() navigate = new EventEmitter<string>();

  onNavigate(route: string): void {
    this.navigate.emit(route);
  }
}
