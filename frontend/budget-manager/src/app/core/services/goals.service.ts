import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { SavingGoal, SavingGoalRequest, SavingDeposit, SavingDepositRequest } from '../models/goal.model';

export interface GoalProgress {
  goal: SavingGoal;
  total_saved: number;
  progress_percentage: number;
  days_remaining: number;
  is_overdue: boolean;
}

@Injectable({ providedIn: 'root' })
export class GoalsService {
  private readonly api = inject(ApiService);

  // Reactive state management
  private goalsSubject = new BehaviorSubject<SavingGoal[]>([]);
  public goals$ = this.goalsSubject.asObservable();

  /**
   * Get all goals
   */
  getAll(): Observable<{ success: boolean; data: SavingGoal[] }> {
    return this.api.get<{ success: boolean; data: SavingGoal[] }>('/goals').pipe(
      tap(response => {
        if (response.success) {
          this.goalsSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Get goal by ID
   */
  getById(id: number): Observable<{ data: SavingGoal }> {
    return this.api.get<{ data: SavingGoal }>(`/goals/${id}`);
  }

  /**
   * Get goal progress with days remaining
   */
  getProgress(id: number): Observable<{ success: boolean; data: GoalProgress }> {
    return this.api.get<{ success: boolean; data: GoalProgress }>(`/goals/${id}/progress`);
  }

  /**
   * Create new goal
   */
  create(data: SavingGoalRequest): Observable<{ success: boolean; data: SavingGoal; message: string }> {
    return this.api.post<{ success: boolean; data: SavingGoal; message: string }>('/goals', data).pipe(
      tap(response => {
        if (response.success) {
          this.refreshGoals();
        }
      })
    );
  }

  /**
   * Update goal
   */
  update(id: number, data: SavingGoalRequest): Observable<{ success: boolean; data: SavingGoal; message: string }> {
    return this.api.put<{ success: boolean; data: SavingGoal; message: string }>(`/goals/${id}`, data).pipe(
      tap(response => {
        if (response.success) {
          this.refreshGoals();
        }
      })
    );
  }

  /**
   * Delete goal
   */
  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`/goals/${id}`).pipe(
      tap(response => {
        if (response.success) {
          this.refreshGoals();
        }
      })
    );
  }

  /**
   * Create deposit for a goal
   */
  createDeposit(goalId: number, data: SavingDepositRequest): Observable<{ success: boolean; data: SavingDeposit; message: string }> {
    return this.api.post<{ success: boolean; data: SavingDeposit; message: string }>(`/goals/${goalId}/deposits`, data).pipe(
      tap(response => {
        if (response.success) {
          this.refreshGoals();
        }
      })
    );
  }

  /**
   * Delete deposit
   */
  deleteDeposit(goalId: number, depositId: number): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`/goals/${goalId}/deposits/${depositId}`).pipe(
      tap(response => {
        if (response.success) {
          this.refreshGoals();
        }
      })
    );
  }

  /**
   * Get deposits for a goal
   */
  getDeposits(goalId: number): Observable<{ success: boolean; data: SavingDeposit[] }> {
    return this.api.get<{ success: boolean; data: SavingDeposit[] }>(`/goals/${goalId}/deposits`);
  }

  /**
   * Refresh goals list
   */
  refreshGoals(): void {
    this.getAll().subscribe();
  }

  /**
   * Get current goals (synchronous)
   */
  getCurrentGoals(): SavingGoal[] {
    return this.goalsSubject.value;
  }

  /**
   * Calculate days remaining for a goal (client-side utility)
   */
  calculateDaysRemaining(deadline: string | Date): number {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Clear goals state
   */
  clear(): void {
    this.goalsSubject.next([]);
  }
}

