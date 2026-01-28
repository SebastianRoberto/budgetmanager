import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { ApiService } from './api.service';
import { Alert } from '../models/alert.model';

export interface AlertFilters {
  is_read?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly api = inject(ApiService);

  // Reactive state management
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  public unreadCount$ = this.alerts$.pipe(
    map(alerts => alerts.filter(alert => !alert.is_read).length)
  );

  /**
   * Get alerts with optional filters
   */
  getAlerts(filters?: AlertFilters): Observable<{ success: boolean; data: Alert[] }> {
    return this.api.get<{ success: boolean; data: Alert[] }>('/alerts', filters as Record<string, string | number | boolean | undefined>).pipe(
      tap(response => {
        if (response.success) {
          this.alertsSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Mark alert as read
   */
  markAsRead(id: number): Observable<{ success: boolean; message: string }> {
    return this.api.put<{ success: boolean; message: string }>(`/alerts/${id}/read`, {}).pipe(
      tap(response => {
        if (response.success) {
          // Update local state
          const currentAlerts = this.alertsSubject.value;
          const updatedAlerts = currentAlerts.map(alert =>
            alert.id === id ? { ...alert, is_read: true } : alert
          );
          this.alertsSubject.next(updatedAlerts);
        }
      })
    );
  }

  /**
   * Refresh alerts
   */
  refreshAlerts(): void {
    this.getAlerts().subscribe();
  }

  /**
   * Get current alerts (synchronous)
   */
  getCurrentAlerts(): Alert[] {
    return this.alertsSubject.value;
  }

  /**
   * Get unread count (synchronous)
   */
  getUnreadCount(): number {
    return this.alertsSubject.value.filter(alert => !alert.is_read).length;
  }

  /**
   * Clear alerts state
   */
  clear(): void {
    this.alertsSubject.next([]);
  }
}

