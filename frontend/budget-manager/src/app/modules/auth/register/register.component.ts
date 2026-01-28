import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage = '';
  fieldErrors: { [key: string]: string } = {};
  loading = false;
  showFormError = false;
  isDarkMode = false;

  // Password strength
  passwordStrength = 0;
  passwordStrengthLabel = '';
  passwordStrengthClass = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private toastr: ToastrService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Check current theme
    this.isDarkMode = this.themeService.isDarkMode();

    // Subscribe to theme changes
    this.themeService.theme$.subscribe(() => {
      this.isDarkMode = this.themeService.isDarkMode();
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
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

  calculatePasswordStrength(): void {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    this.passwordStrength = strength;

    if (strength <= 2) {
      this.passwordStrengthLabel = 'Debil';
      this.passwordStrengthClass = 'weak';
    } else if (strength <= 3) {
      this.passwordStrengthLabel = 'Media';
      this.passwordStrengthClass = 'medium';
    } else {
      this.passwordStrengthLabel = 'Fuerte';
      this.passwordStrengthClass = 'strong';
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastr.warning('Por favor completa todos los campos correctamente', 'Formulario Incompleto');
      return;
    }

    // Clear previous error states when starting new attempt
    this.errorMessage = '';
    this.fieldErrors = {};
    this.loading = true;
    this.showFormError = false;

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success('¡Cuenta creada exitosamente!', 'Registro Exitoso');

        // Navigate to login
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (error) => {
        this.loading = false;

        // Wrap state changes in setTimeout to avoid NG0100 error
        setTimeout(() => {
          this.showFormError = true;

          if (error.status === 422 && error.error?.errors) {
            this.fieldErrors = {};
            const errors = error.error.errors;

            Object.keys(errors).forEach(key => {
              this.fieldErrors[key] = Array.isArray(errors[key])
                ? errors[key][0]
                : errors[key];
            });

            this.errorMessage = 'Por favor, corrige los errores en el formulario';
            this.toastr.error(this.errorMessage, 'Error de Validación');
          } else {
            this.errorMessage = error.error?.message || 'Error al registrar usuario';
            this.toastr.error(this.errorMessage, 'Error');
          }

          // Clear shake animation after 500ms
          setTimeout(() => {
            this.showFormError = false;
          }, 500);
        }, 0);
      }
    });
  }

  getFieldError(fieldName: string): string | null {
    return this.fieldErrors[fieldName] || null;
  }

  get nameInvalid(): boolean {
    const name = this.registerForm.get('name');
    return !!(name && name.invalid && (name.dirty || name.touched));
  }

  get emailInvalid(): boolean {
    const email = this.registerForm.get('email');
    return !!(email && email.invalid && (email.dirty || email.touched));
  }

  get passwordInvalid(): boolean {
    const password = this.registerForm.get('password');
    return !!(password && password.invalid && (password.dirty || password.touched));
  }

  get passwordConfirmInvalid(): boolean {
    const confirm = this.registerForm.get('password_confirmation');
    return !!(confirm && confirm.invalid && (confirm.dirty || confirm.touched));
  }

  get hasMinLength(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return password.length >= 8;
  }

  get passwordsMatch(): boolean {
    const password = this.registerForm.get('password')?.value;
    const confirm = this.registerForm.get('password_confirmation')?.value;
    return password === confirm && confirm !== '';
  }
}
