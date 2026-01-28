import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface AlertItem {
  id: number;
  type: string;
  payload: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

@Component({
  selector: 'app-alert-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './alert-panel.component.html',
  styleUrl: './alert-panel.component.scss'
})
export class AlertPanelComponent {
  @Input() alerts: AlertItem[] = [];
  @Input() loading = false;

  get hasAlerts(): boolean {
    return !this.loading && this.alerts && this.alerts.length > 0;
  }

  getAlertTitle(alert: AlertItem): string {
    const map: Record<string, string> = {
      budget_exceeded: 'Presupuesto superado',
      category_exceeded: 'Categoría al límite',
      debt_due: 'Deuda vencida',
      goal_offtrack: 'Meta de ahorro atrasada'
    };
    return map[alert.type] ?? 'Alerta';
  }

  getAlertDescription(alert: AlertItem): string {
    const payload = alert.payload ?? {};
    switch (alert.type) {
      case 'budget_exceeded':
        return `Has gastado ${this.formatCurrency(payload['total'])} de un límite de ${
          payload['limit'] ? this.formatCurrency(payload['limit']) : 'N/D'
        } en ${this.formatMonth(payload['month'], payload['year'])}.`;
      case 'category_exceeded':
        return `${payload['category_name'] ?? 'Una categoría'} superó el límite (${this.formatCurrency(
          payload['total']
        )} / ${payload['limit'] ? this.formatCurrency(payload['limit']) : 'N/D'}).`;
      case 'debt_due':
        return `La deuda con ${payload['person'] ?? 'N/D'} venció el ${payload['due_date']}.`;
      case 'goal_offtrack':
        return `Tu meta ${payload['goal_title'] ?? ''} necesita ${
          payload['suggested_amount'] ? this.formatCurrency(payload['suggested_amount']) : 'ajustes'
        }.`;
      default:
        return 'Revisa los detalles en la sección de alertas.';
    }
  }

  private formatCurrency(value: number | string | undefined): string {
    if (value === undefined || value === null) return 'N/D';
    const numeric = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(numeric)) return 'N/D';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numeric);
  }

  private formatMonth(month?: number, year?: number): string {
    if (!month || !year) return 'este mes';
    const date = new Date(year, month - 1);
    return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  }
}


