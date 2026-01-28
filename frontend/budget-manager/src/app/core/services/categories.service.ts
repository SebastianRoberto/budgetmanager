import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Category, CategoryRequest } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly api = inject(ApiService);

  getAll(): Observable<{ data: Category[] }> {
    return this.api.get<{ data: Category[] }>('/categories');
  }

  getById(id: number): Observable<{ data: Category }> {
    return this.api.get<{ data: Category }>(`/categories/${id}`);
  }

  create(data: CategoryRequest): Observable<{ success: boolean; data: Category; message: string }> {
    return this.api.post<{ success: boolean; data: Category; message: string }>('/categories', data);
  }

  update(id: number, data: CategoryRequest): Observable<{ success: boolean; data: Category; message: string }> {
    return this.api.put<{ success: boolean; data: Category; message: string }>(`/categories/${id}`, data);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`/categories/${id}`);
  }
}

