import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { PieChartComponent } from '../../shared/components/pie-chart/pie-chart.component';
import { AlertPanelComponent } from '../../shared/components/alert-panel/alert-panel.component';
import {
  DashboardData,
  DashboardService
} from '../../core/services/dashboard.service';
import { TransactionsService } from '../../core/services/transactions.service';
import { BudgetsService } from '../../core/services/budgets.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    NavbarComponent,
    CardComponent,
    PieChartComponent,
    AlertPanelComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly budgetsService = inject(BudgetsService);
  private readonly router = inject(Router);
  private subscriptions: Subscription[] = [];

  loading = true;
  error: string | null = null;
  data: DashboardData | null = null;
  lastUpdated: Date | null = null;

  readonly monthLabel = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  ngOnInit(): void {
    this.loadDashboard();

    // Subscribe to reactive updates - refresh dashboard when data changes
    const transactionsSub = this.transactionsService.summary$.subscribe(summary => {
      if (summary && !this.loading) {
        this.loadDashboard();
      }
    });

    const budgetSub = this.budgetsService.budget$.subscribe(budget => {
      if (budget && !this.loading) {
        this.loadDashboard();
      }
    });

    this.subscriptions.push(transactionsSub, budgetSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = null;

    const sub = this.dashboardService.getDashboardData().subscribe({
      next: (response: { success: boolean; data: DashboardData }) => {
        this.data = response.data;
        this.loading = false;
        this.lastUpdated = new Date();
      },
      error: () => {
        this.error = 'No pudimos cargar el dashboard. Intenta nuevamente en unos segundos.';
        this.loading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  get hasData(): boolean {
    return !!this.data && (this.categoryTotals.length > 0);
  }

  get categoryLabels(): string[] {
    return (
      this.data?.expenses_by_category?.map(
        (item) => item.category?.name ?? 'Sin categoría'
      ) ?? []
    );
  }

  get categoryTotals(): number[] {
    return this.data?.expenses_by_category?.map((item) => item.total ?? 0) ?? [];
  }

  get goalCardValue(): string | number {
    if (!this.data?.active_goal) {
      return 'Sin metas activas';
    }
    return `${Math.round(this.data.active_goal.progress_percentage)}%`;
  }

  get goalCardSubtitle(): string {
    if (!this.data?.active_goal) {
      return 'Crea una meta para empezar a ahorrar';
    }
    const goal = this.data.active_goal;
    const days = Math.floor(Number(goal.days_remaining));
    const suffix =
      days > 0 ? `Faltan ${days} días` : days === 0 ? 'Vence hoy' : 'Meta vencida';
    return `${goal.title} • ${suffix}`;
  }

  get categoryList(): Array<{ name: string; total: number }> {
    return (
      this.data?.expenses_by_category?.map((item) => ({
        name: item.category?.name ?? 'Sin categoría',
        total: item.total ?? 0
      })) ?? []
    );
  }

  navigateTo(path: string): void {
    this.router.navigate([`/${path}`]);
  }
}


