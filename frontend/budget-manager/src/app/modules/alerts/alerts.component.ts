import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { AlertsService } from '../../core/services/alerts.service';
import { Alert, AlertType } from '../../core/models/alert.model';

type FilterType = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, SidebarComponent, NavbarComponent],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss'
})
export class AlertsComponent implements OnInit, OnDestroy {
  private readonly alertsService = inject(AlertsService);
  private readonly destroy$ = new Subject<void>();

  alerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  loading = false;
  error: string | null = null;
  activeFilter: FilterType = 'all';
  markingAsRead = new Set<number>();

  ngOnInit(): void {
    this.loadAlerts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAlerts(): void {
    this.loading = true;
    this.error = null;

    // Always fetch ALL alerts to maintain accurate counts
    this.alertsService
      .getAlerts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.alerts = response.data || [];
          this.applyFilter();
          this.loading = false;
        },
        error: () => {
          this.error = 'No pudimos cargar las alertas. Intenta nuevamente.';
          this.loading = false;
        }
      });
  }

  setFilter(filter: FilterType): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  private applyFilter(): void {
    switch (this.activeFilter) {
      case 'unread':
        this.filteredAlerts = this.alerts.filter(a => !a.is_read);
        break;
      case 'read':
        this.filteredAlerts = this.alerts.filter(a => a.is_read);
        break;
      default:
        this.filteredAlerts = [...this.alerts];
    }
  }

  markAsRead(alert: Alert): void {
    if (alert.is_read || this.markingAsRead.has(alert.id)) {
      return;
    }

    this.markingAsRead.add(alert.id);

    this.alertsService
      .markAsRead(alert.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert.is_read = true;
          this.markingAsRead.delete(alert.id);
          if (this.activeFilter === 'unread') {
            this.filteredAlerts = this.filteredAlerts.filter((a) => a.id !== alert.id);
          }
        },
        error: () => {
          this.error = 'No pudimos marcar la alerta como leída. Intenta nuevamente.';
          this.markingAsRead.delete(alert.id);
        }
      });
  }

  getAlertTitle(alert: Alert): string {
    const map: Record<AlertType, string> = {
      budget_exceeded: 'Presupuesto superado',
      category_exceeded: 'Categoría superada',
      debt_due: 'Deuda vencida',
      goal_offtrack: 'Meta de ahorro atrasada'
    };
    return map[alert.type] ?? 'Alerta';
  }

  getAlertDescription(alert: Alert): string {
    const payload = alert.payload ?? {};
    switch (alert.type) {
      case 'budget_exceeded':
        return `Has gastado ${this.formatCurrency(payload['total'] as number)} de un límite de ${payload['limit'] ? this.formatCurrency(payload['limit'] as number) : 'N/D'
          } en ${this.formatMonth(payload['month'] as number, payload['year'] as number)}.`;
      case 'category_exceeded':
        return `${payload['category_name'] ?? 'Una categoría'} superó el límite (${this.formatCurrency(
          payload['total'] as number
        )} / ${payload['limit'] ? this.formatCurrency(payload['limit'] as number) : 'N/D'}).`;
      case 'debt_due':
        return `La deuda con ${payload['person'] ?? 'N/D'} por ${this.formatCurrency(
          payload['amount'] as number
        )} venció el ${this.formatDate(payload['due_date'] as string)}.`;
      case 'goal_offtrack':
        return `Tu meta "${payload['goal_title'] ?? 'N/D'}" necesita ${payload['suggested_amount'] ? this.formatCurrency(payload['suggested_amount'] as number) : 'ajustes'
          } para estar al día.`;
      default:
        return 'Revisa los detalles de esta alerta.';
    }
  }

  getAlertIcon(alert: Alert): string {
    const map: Record<AlertType, string> = {
      budget_exceeded: '📊',
      category_exceeded: '📁',
      debt_due: '💳',
      goal_offtrack: '🎯'
    };
    return map[alert.type] ?? '⚠️';
  }

  getAlertColor(alert: Alert): string {
    if (alert.is_read) return '#94a3b8';
    const map: Record<AlertType, string> = {
      budget_exceeded: '#ef4444',
      category_exceeded: '#f59e0b',
      debt_due: '#dc2626',
      goal_offtrack: '#f97316'
    };
    return map[alert.type] ?? '#6366f1';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/D';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return 'N/D';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatMonth(month?: number, year?: number): string {
    if (!month || !year) return 'este mes';
    const date = new Date(year, month - 1);
    return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  }

  get unreadCount(): number {
    return this.alerts.filter((a) => !a.is_read).length;
  }

  get readCount(): number {
    return this.alerts.filter((a) => a.is_read).length;
  }
}
