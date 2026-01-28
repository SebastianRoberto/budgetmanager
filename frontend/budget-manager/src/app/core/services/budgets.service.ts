import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  MonthlyBudget,
  MonthlyBudgetRequest,
  MonthlyBudgetSummary
} from '../models/monthly-budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetsService {
  private readonly api = inject(ApiService);

  // Reactive state management
  private budgetSubject = new BehaviorSubject<MonthlyBudgetSummary | null>(null);
  public budget$ = this.budgetSubject.asObservable();

  /**
   * Get current budget value (synchronous)
   */
  getCurrentBudget(): MonthlyBudgetSummary | null {
    return this.budgetSubject.value;
  }

  /**
   * Fetch budget for specific month/year
   */
  getBudget(month: number, year: number): Observable<{ success: boolean; data: MonthlyBudgetSummary }> {
    return this.api.get<{ success: boolean; data: MonthlyBudgetSummary }>('/monthly-budget', {
      month,
      year
    }).pipe(
      tap(response => {
        if (response.success) {
          this.budgetSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Save or update budget
   */
  saveBudget(data: MonthlyBudgetRequest): Observable<{ success: boolean; data: MonthlyBudget; message: string }> {
    return this.api.post<{ success: boolean; data: MonthlyBudget; message: string }>('/monthly-budget', data).pipe(
      tap(response => {
        if (response.success) {
          // Refresh budget data after save
          this.refreshBudget(data.month, data.year);
        }
      })
    );
  }

  /**
   * Manually refresh budget data
   */
  refreshBudget(month: number, year: number): void {
    this.getBudget(month, year).subscribe();
  }

  /**
   * Clear budget state
   */
  clearBudget(): void {
    this.budgetSubject.next(null);
  }
}

