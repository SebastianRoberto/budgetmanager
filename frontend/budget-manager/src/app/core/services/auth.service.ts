import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { Observable, tap } from 'rxjs';

const TOKEN_KEY = 'bm_token';
const USER_KEY = 'bm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly currentUser = signal<User | null>(this.loadUserFromStorage());

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', payload).pipe(
      tap((res) => {
        this.persistAuth(res);
      })
    );
  }

  register(payload: RegisterRequest): Observable<{ success: boolean; message: string; user: User }> {
    // No persistir auth automáticamente, el usuario debe hacer login
    return this.api.post<{ success: boolean; message: string; user: User }>('/auth/register', payload);
  }

  logout(): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('/auth/logout', {}).pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigateByUrl('/login');
      })
    );
  }

  private persistAuth(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  private loadUserFromStorage(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  updateUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }
}


