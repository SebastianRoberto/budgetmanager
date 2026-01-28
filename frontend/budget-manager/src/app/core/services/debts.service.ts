import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Debt, DebtRequest } from '../models/debt.model';

@Injectable({ providedIn: 'root' })
export class DebtsService {
  private readonly api = inject(ApiService);

  getAll(type?: 'outgoing' | 'incoming'): Observable<{ success: boolean; data: Debt[] }> {
    const params = type ? { type } : undefined;
    return this.api.get<{ success: boolean; data: Debt[] }>('/debts', params);
  }

  getById(id: number): Observable<{ data: Debt }> {
    return this.api.get<{ data: Debt }>(`/debts/${id}`);
  }

  create(data: DebtRequest): Observable<{ success: boolean; data: Debt; message: string }> {
    return this.api.post<{ success: boolean; data: Debt; message: string }>('/debts', data);
  }

  update(id: number, data: DebtRequest): Observable<{ success: boolean; data: Debt; message: string }> {
    return this.api.put<{ success: boolean; data: Debt; message: string }>(`/debts/${id}`, data);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`/debts/${id}`);
  }
}

