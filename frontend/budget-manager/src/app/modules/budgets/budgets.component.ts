import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { BudgetsService } from '../../core/services/budgets.service';
import { MonthlyBudgetSummary } from '../../core/models/monthly-budget.model';
import { SwalUtils } from '../../core/utils/swal';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, NavbarComponent],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.scss'
})
export class BudgetsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly budgetsService = inject(BudgetsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  loading = false;
  saving = false;
  saveSuccess = false;
  shakeInput = false;
  error: string | null = null;

  // Expose Math for template
  readonly Math = Math;

  summary: MonthlyBudgetSummary | null = null;

  readonly months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  readonly years = this.buildYearsRange();

  readonly filterForm = this.fb.nonNullable.group({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  readonly budgetForm = this.fb.nonNullable.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]]
  });

  ngOnInit(): void {
    this.loadBudget();

    // Subscribe to reactive budget updates
    this.budgetsService.budget$.pipe(takeUntil(this.destroy$)).subscribe(budget => {
      if (budget) {
        this.summary = budget;
        const amount = budget.budget?.amount ?? null;
        this.budgetForm.patchValue({ amount }, { emitEvent: false });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildYearsRange(): number[] {
    const currentYear = new Date().getFullYear();
    const range: number[] = [];
    for (let offset = -2; offset <= 2; offset++) {
      range.push(currentYear + offset);
    }
    return range;
  }

  get monthLabel(): string {
    const monthValue = this.filterForm.controls.month.value;
    const found = this.months.find((m) => m.value === monthValue);
    return found?.label ?? '';
  }

  get percentageUsed(): number {
    return this.summary?.percentage_used ?? 0;
  }

  get isOverBudget(): boolean {
    return (this.summary?.percentage_used ?? 0) > 100;
  }

  get remainingText(): string {
    if (!this.summary?.budget || this.summary.remaining === null) {
      return 'Aún no has configurado un presupuesto para este mes.';
    }
    if (this.isOverBudget) {
      const exceso = Math.abs(this.summary.remaining ?? 0);
      return `Has excedido el presupuesto en $${exceso.toFixed(2)}.`;
    }
    return `Te quedan $${(this.summary.remaining ?? 0).toFixed(2)} por gastar.`;
  }

  loadBudget(): void {
    const { month, year } = this.filterForm.getRawValue();
    this.loading = true;
    this.error = null;

    this.budgetsService
      .getBudget(month, year)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.summary = response.data;
          const amount = response.data.budget?.amount ?? null;
          this.budgetForm.patchValue({ amount });
          this.loading = false;
        },
        error: () => {
          this.error = 'No pudimos cargar el presupuesto. Intenta nuevamente.';
          this.loading = false;
        }
      });
  }

  onFiltersChange(): void {
    this.loadBudget();
  }

  saveBudget(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      this.triggerShake();
      return;
    }

    const { month, year } = this.filterForm.getRawValue();
    const amount = this.budgetForm.controls.amount.value ?? 0;

    console.log('[Budget] Saving new amount:', amount);

    this.saving = true;
    this.saveSuccess = false;

    this.budgetsService
      .saveBudget({ month, year, amount })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('[Budget] Save successful, updating UI...');

          this.saving = false;
          this.saveSuccess = true;

          // REAL FIX: Create a completely NEW summary object to trigger change detection
          const expenses = this.summary?.total_expenses ?? 0;
          const newRemaining = amount - expenses;
          const newPercentage = amount > 0 ? (expenses / amount) * 100 : 0;

          // Create NEW object (not mutate existing)
          this.summary = {
            ...this.summary,
            budget: {
              id: this.summary?.budget?.id ?? 0,
              user_id: this.summary?.budget?.user_id ?? 0,
              month,
              year,
              amount,
              created_at: this.summary?.budget?.created_at ?? '',
              updated_at: new Date().toISOString()
            },
            total_expenses: expenses,
            remaining: newRemaining,
            percentage_used: newPercentage
          } as MonthlyBudgetSummary;

          console.log('[Budget] New summary:', this.summary);

          // FORCE Angular to detect the changes NOW
          this.cdr.detectChanges();

          // Auto-hide success after 2 seconds
          setTimeout(() => {
            this.saveSuccess = false;
            this.cdr.detectChanges();
          }, 2000);
        },
        error: (error) => {
          console.error('[Budget] Save error:', error);
          this.saving = false;
          this.triggerShake();
          SwalUtils.error('Error', error.error?.message || 'No se pudo guardar el presupuesto');
        }
      });
  }

  formatCurrency(value: number): string {
    return '$' + new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  // Check if new budget is below current expenses
  get isBudgetBelowExpenses(): boolean {
    const newAmount = this.budgetForm.controls.amount.value ?? 0;
    const expenses = this.summary?.total_expenses ?? 0;
    return newAmount > 0 && newAmount < expenses;
  }

  // Trigger shake animation
  triggerShake(): void {
    this.shakeInput = true;
    setTimeout(() => {
      this.shakeInput = false;
    }, 500);
  }
}
