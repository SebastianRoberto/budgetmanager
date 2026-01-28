import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'login',
    loadComponent: () =>
      import('./modules/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./modules/auth/register/register.component').then((m) => m.RegisterComponent)
  },

  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'transacciones',
        loadComponent: () =>
          import('./modules/transactions/transactions.component').then(
            (m) => m.TransactionsComponent
          )
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./modules/categories/categories.component').then((m) => m.CategoriesComponent)
      },
      {
        path: 'presupuesto',
        loadComponent: () =>
          import('./modules/budgets/budgets.component').then((m) => m.BudgetsComponent)
      },
      {
        path: 'deudas',
        loadComponent: () =>
          import('./modules/debts/debts.component').then((m) => m.DebtsComponent)
      },
      {
        path: 'metas',
        loadComponent: () =>
          import('./modules/goals/goals.component').then((m) => m.GoalsComponent)
      },
      {
        path: 'alertas',
        loadComponent: () =>
          import('./modules/alerts/alerts.component').then((m) => m.AlertsComponent)
      },
      {
        path: 'ajustes',
        loadComponent: () =>
          import('./modules/settings/settings.component').then((m) => m.SettingsComponent)
      }
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];
