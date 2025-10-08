import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-note-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-note-modal.html',
  styleUrls: ['./add-note-modal.scss']
})
export class AddNoteModalComponent {
  @Input() session: any = null;
  @Input() isSaving = false;
  @Output() save = new EventEmitter<{ sessionId: string; note: string }>();
  @Output() cancel = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  noteText = '';
  showSuccessMessage = false;

  ngOnChanges(): void {
    this.noteText = this.session?.notes || '';
  }

  closeModal(): void {
    this.cancel.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  saveNote(): void {
    if (!this.session) return;
    const trimmed = (this.noteText || '').trim();
    this.save.emit({ sessionId: this.session.id, note: trimmed });
  }

  showSuccess(): void {
    this.showSuccessMessage = true;
    this.isSaving = false;
  }

  closeSuccess(): void {
    this.showSuccessMessage = false;
    this.success.emit();
  }
}


