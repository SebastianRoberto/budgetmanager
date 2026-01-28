import { Component, OnDestroy, OnInit, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, NavbarComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly settingsService = inject(SettingsService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  profileForm: FormGroup;
  passwordForm: FormGroup;
  savingProfile = false;
  savingPassword = false;
  profileSuccess = '';
  passwordSuccess = '';
  profileError = '';
  passwordError = '';

  // Shake animation triggers
  shakeProfile = false;
  shakePassword = false;

  // Password visibility toggles
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Success state for button
  passwordUpdateSuccess = false;

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.passwordForm = this.fb.group(
      {
        current_password: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        password_confirmation: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const passwordConfirmation = form.get('password_confirmation');

    if (password && passwordConfirmation && password.value !== passwordConfirmation.value) {
      passwordConfirmation.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Toggle password visibility
  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.triggerShake('profile');
      return;
    }

    this.savingProfile = true;
    this.profileError = '';
    this.profileSuccess = '';

    this.settingsService
      .updateProfile(this.profileForm.value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.savingProfile = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.profileSuccess = response.message;
          this.authService.updateUser(response.data);
          this.toastr.success('Perfil actualizado correctamente', '¡Éxito!');

          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            this.profileSuccess = '';
          }, 5000);
        },
        error: (error) => {
          this.profileError =
            error.error?.message || 'No pudimos actualizar tu perfil. Intenta nuevamente.';
          this.triggerShake('profile');
          this.toastr.error(this.profileError, 'Error');
        }
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.triggerShake('password');
      return;
    }

    this.savingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';
    this.passwordUpdateSuccess = false;

    this.settingsService
      .changePassword(this.passwordForm.value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.savingPassword = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.passwordSuccess = response.message;
          this.passwordUpdateSuccess = true;
          this.passwordForm.reset();
          this.toastr.success('Contraseña actualizada exitosamente', '¡Éxito!');

          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            this.passwordSuccess = '';
            this.passwordUpdateSuccess = false;
          }, 5000);
        },
        error: (error) => {
          let errorMessage = 'No pudimos cambiar tu contraseña. Intenta nuevamente.';

          if (error.status === 422 && error.error?.errors) {
            const errors = error.error.errors;
            if (errors.current_password) {
              errorMessage = errors.current_password[0];
              // Clear and focus current password field
              this.passwordForm.get('current_password')?.reset();
            } else if (errors.password) {
              errorMessage = errors.password[0];
            }
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          this.passwordError = errorMessage;
          this.triggerShake('password');
          this.toastr.error(errorMessage, 'Error');
        }
      });
  }

  // Trigger shake animation for a section
  private triggerShake(section: 'profile' | 'password'): void {
    if (section === 'profile') {
      this.shakeProfile = true;
      setTimeout(() => {
        this.shakeProfile = false;
      }, 500);
    } else {
      this.shakePassword = true;
      setTimeout(() => {
        this.shakePassword = false;
      }, 500);
    }
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  // Helper to check if passwords match
  get passwordsMatch(): boolean {
    const password = this.passwordForm.get('password')?.value;
    const confirmation = this.passwordForm.get('password_confirmation')?.value;
    return password && confirmation && password === confirmation;
  }
}
