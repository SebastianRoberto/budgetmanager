import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardData {
  balance: number;
  monthly_income: number;
  monthly_expense: number;
  expenses_by_category: Array<{
    category: {
      id: number;
      name: string;
    };
    total: number;
  }>;
  active_goal: {
    id: number;
    title: string;
    target_amount: number;
    total_saved: number;
    progress_percentage: number;
    deadline: string;
    days_remaining: number;
  } | null;
  recent_alerts: Array<{
    id: number;
    type: string;
    payload: any;
    is_read: boolean;
    created_at: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getDashboardData(): Observable<{ success: boolean; data: DashboardData }> {
    return this.api.get<{ success: boolean; data: DashboardData }>('/dashboard');
  }
}

