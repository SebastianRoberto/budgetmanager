import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CellType = 'text' | 'currency' | 'date' | 'badge' | 'custom';

export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  type?: CellType;
  align?: 'left' | 'center' | 'right';
  width?: string;
  badgeColor?: 'success' | 'warning' | 'danger' | 'info';
  badgeColorFn?: (row: T) => 'success' | 'warning' | 'danger' | 'info';
  formatter?: (value: any, row: T) => string;
}

export interface TableAction<T = any> {
  key: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'danger' | 'ghost';
  show?: (row: T) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent<T = any> {
  @Input() columns: TableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No hay registros disponibles';
  @Input() showIndex = false;
  @Input() actions: TableAction<T>[] = [];

  @Output() action = new EventEmitter<{ action: string; row: T }>();

  get hasActions(): boolean {
    return this.actions && this.actions.length > 0;
  }

  trackByIndex(index: number): number {
    return index;
  }

  emitAction(action: TableAction<T>, row: T): void {
    if (action.show && !action.show(row)) {
      return;
    }
    this.action.emit({ action: action.key, row });
  }

  resolveValue(row: T, column: TableColumn<T>): any {
    const value =
      typeof column.key === 'string' ? (row as Record<string, any>)[column.key] : row[column.key];
    if (column.formatter) {
      return column.formatter(value, row);
    }
    return value;
  }

  formatValue(value: any, column: TableColumn<T>): string {
    if (value === null || value === undefined) {
      return '-';
    }

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('es-PE', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(Number(value) || 0);
      case 'date':
        // Use UTC to prevent timezone offset issues
        return new Intl.DateTimeFormat('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC'
        }).format(new Date(value));
      default:
        return String(value);
    }
  }
}


