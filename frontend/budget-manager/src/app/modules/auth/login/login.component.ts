import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private toastr = inject(ToastrService);
    private themeService = inject(ThemeService);

    loginForm: FormGroup;
    errorMessage = '';
    registered = false;
    loading = false;
    loginSuccess = false;
    showFormError = false;
    isDarkMode = false;

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]]
        });
    }

    ngOnInit(): void {
        // Check current theme
        this.isDarkMode = this.themeService.isDarkMode();

        // Subscribe to theme changes
        this.themeService.theme$.subscribe(() => {
            this.isDarkMode = this.themeService.isDarkMode();
        });

        this.route.queryParams.subscribe(params => {
            if (params['registered'] === 'true') {
                this.registered = true;
                this.toastr.success('Cuenta creada exitosamente. Ahora puedes iniciar sesión.', 'Registro Exitoso');
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: {}
                });

                // Auto-hide success banner after 5 seconds
                setTimeout(() => {
                    this.registered = false;
                }, 5000);
            }
        });
    }

    toggleTheme(): void {
        this.themeService.toggleTheme();
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            this.toastr.warning('Por favor completa todos los campos correctamente', 'Formulario Incompleto');
            return;
        }

        // Clear previous error messages when starting new attempt
        this.errorMessage = '';
        this.loading = true;
        this.showFormError = false;

        this.authService.login(this.loginForm.value).subscribe({
            next: () => {
                this.loading = false;
                this.loginSuccess = true;
                this.toastr.success('¡Bienvenido de vuelta!', 'Inicio de Sesión Exitoso');

                // Delay navigation for UX (show success state)
                setTimeout(() => {
                    this.router.navigate(['/dashboard']);
                }, 800);
            },
            error: (error) => {
                this.loading = false;
                console.error('Login error:', error);

                // Wrap state changes in setTimeout to avoid NG0100 error
                setTimeout(() => {
                    this.showFormError = true;

                    if (error.status === 422) {
                        const errors = error.error?.errors || {};

                        if (errors.email) {
                            this.errorMessage = errors.email[0];
                            this.toastr.error(errors.email[0], 'Error de Autenticación');
                        } else if (errors.password) {
                            this.errorMessage = errors.password[0];
                            this.toastr.error(errors.password[0], 'Error de Autenticación');
                        } else {
                            this.errorMessage = error.error?.message || 'Credenciales incorrectas';
                            this.toastr.error(this.errorMessage, 'Error de Autenticación');
                        }

                        // Clear password on error
                        this.loginForm.patchValue({ password: '' });
                    } else if (error.status === 0) {
                        this.errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
                        this.toastr.error(this.errorMessage, 'Error de Conexión');
                    } else {
                        this.errorMessage = error.error?.message || 'Error al iniciar sesión. Intenta nuevamente.';
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

    get emailInvalid(): boolean {
        const email = this.loginForm.get('email');
        return !!(email && email.invalid && (email.dirty || email.touched));
    }

    get passwordInvalid(): boolean {
        const password = this.loginForm.get('password');
        return !!(password && password.invalid && (password.dirty || password.touched));
    }
}
