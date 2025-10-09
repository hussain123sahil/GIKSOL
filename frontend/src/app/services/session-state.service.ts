import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Session } from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class SessionStateService {
  private sessionUpdateSubject = new BehaviorSubject<{ action: string; session: Session } | null>(null);
  public sessionUpdate$ = this.sessionUpdateSubject.asObservable();

  constructor() { }

  // Emit session updates to notify other components
  updateSession(action: 'start' | 'cancel' | 'note-update', session: Session): void {
    this.sessionUpdateSubject.next({ action, session });
  }

  // Get the current session update observable
  getSessionUpdates(): Observable<{ action: string; session: Session } | null> {
    return this.sessionUpdate$;
  }
}
