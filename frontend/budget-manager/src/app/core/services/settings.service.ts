import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

export interface UpdateProfileRequest {
  name: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(ApiService);

  updateProfile(data: UpdateProfileRequest): Observable<{ success: boolean; message: string; data: User }> {
    return this.api.put<{ success: boolean; message: string; data: User }>('/settings/profile', data);
  }

  changePassword(data: ChangePasswordRequest): Observable<{ success: boolean; message: string }> {
    return this.api.put<{ success: boolean; message: string }>('/settings/password', data);
  }
}

