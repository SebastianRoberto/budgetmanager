import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Transaction, TransactionRequest } from '../models/transaction.model';

export interface TransactionFilters {
  month?: number;
  year?: number;
  type?: 'income' | 'expense';
  category_id?: number;
  page?: number;
}

export interface TransactionListResponse {
  data: Transaction[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary?: {
    total_income: number;
    total_expense: number;
    balance?: number;
  };
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly api = inject(ApiService);

  // Reactive state management
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$ = this.transactionsSubject.asObservable();

  private summarySubject = new BehaviorSubject<TransactionListResponse['summary'] | null>(null);
  public summary$ = this.summarySubject.asObservable();

  private currentFilters: TransactionFilters = {};

  /**
   * Get all transactions with filters
   */
  getAll(filters?: TransactionFilters & { per_page?: number }): Observable<TransactionListResponse> {
    this.currentFilters = filters || {};
    return this.api.get<TransactionListResponse>(
      '/transactions',
      filters as Record<string, string | number | boolean | undefined>
    ).pipe(
      tap(response => {
        this.transactionsSubject.next(response.data);
        this.summarySubject.next(response.summary || null);
      })
    );
  }

  /**
   * Get transaction by ID
   */
  getById(id: number): Observable<{ data: Transaction }> {
    return this.api.get<{ data: Transaction }>(`/transactions/${id}`);
  }

  /**
   * Create new transaction
   */
  create(data: TransactionRequest): Observable<{ success: boolean; data: Transaction; message: string }> {
    return this.api.post<{ success: boolean; data: Transaction; message: string }>('/transactions', data).pipe(
      tap(response => {
        if (response.success) {
          // Refresh transactions list
          this.refreshTransactions();
        }
      })
    );
  }

  /**
   * Update existing transaction
   */
  update(id: number, data: TransactionRequest): Observable<{ success: boolean; data: Transaction; message: string }> {
    return this.api.put<{ success: boolean; data: Transaction; message: string }>(`/transactions/${id}`, data).pipe(
      tap(response => {
        if (response.success) {
          // Refresh transactions list
          this.refreshTransactions();
        }
      })
    );
  }

  /**
   * Delete transaction
   */
  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`/transactions/${id}`).pipe(
      tap(response => {
        if (response.success) {
          // Refresh transactions list
          this.refreshTransactions();
        }
      })
    );
  }

  /**
   * Manually refresh transactions with current filters
   */
  refreshTransactions(): void {
    this.getAll(this.currentFilters).subscribe();
  }

  /**
   * Get current transactions (synchronous)
   */
  getCurrentTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

  /**
   * Get current summary (synchronous)
   */
  getCurrentSummary(): TransactionListResponse['summary'] | null {
    return this.summarySubject.value;
  }

  /**
   * Clear transactions state
   */
  clear(): void {
    this.transactionsSubject.next([]);
    this.summarySubject.next(null);
  }
}

