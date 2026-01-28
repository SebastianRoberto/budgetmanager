import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';
import { DataTableComponent, TableColumn, TableAction } from '../../shared/components/data-table/data-table.component';
import { GoalsService } from '../../core/services/goals.service';
import {
  SavingGoal,
  SavingGoalRequest,
  SavingDeposit,
  SavingDepositRequest
} from '../../core/models/goal.model';
import { SwalUtils } from '../../core/utils/swal';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    NavbarComponent,
    FormModalComponent,
    DataTableComponent
  ],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.scss'
})
export class GoalsComponent implements OnInit, OnDestroy {
  private readonly goalsService = inject(GoalsService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  goals: SavingGoal[] = [];
  loading = false;
  error: string | null = null;

  showGoalModal = false;
  editingGoal: SavingGoal | null = null;
  savingGoal = false;
  goalForm: FormGroup;

  showDepositModal = false;
  selectedGoal: SavingGoal | null = null;
  deposits: SavingDeposit[] = [];
  loadingDeposits = false;
  savingDeposit = false;
  depositForm: FormGroup;

  readonly depositColumns: TableColumn<SavingDeposit>[] = [
    { key: 'date', label: 'Fecha', type: 'date' },
    { key: 'amount', label: 'Monto', type: 'currency', align: 'right' },
    { key: 'created_at', label: 'Registrado', type: 'date' }
  ];

  readonly depositActions: TableAction<SavingDeposit>[] = [
    { key: 'delete', label: 'Eliminar', icon: '🗑️', color: 'danger' }
  ];

  constructor() {
    this.goalForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      target_amount: [0, [Validators.required, Validators.min(0.01)]],
      deadline: ['', [Validators.required]]
    });

    this.depositForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadGoals();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGoals(): void {
    this.loading = true;
    this.error = null;
    console.log('[Goals] Loading goals...');

    this.goalsService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[Goals] Goals loaded:', response.data);
          this.goals = response.data || [];
          this.loading = false;
          this.triggerViewUpdate();
        },
        error: (error) => {
          console.error('[Goals] Error loading goals:', error);
          this.error = 'No pudimos cargar las metas. Intenta nuevamente.';
          this.loading = false;
          SwalUtils.error('Error', 'No se pudieron cargar las metas');
          this.triggerViewUpdate();
        }
      });
  }

  openCreateGoalModal(): void {
    this.editingGoal = null;
    this.goalForm.reset({
      title: '',
      target_amount: 0,
      deadline: ''
    });
    this.showGoalModal = true;
  }

  openEditGoalModal(goal: SavingGoal): void {
    this.editingGoal = goal;

    // Format deadline to YYYY-MM-DD for date input
    let formattedDeadline = goal.deadline;
    if (goal.deadline) {
      const date = new Date(goal.deadline);
      formattedDeadline = date.toISOString().split('T')[0];
    }

    this.goalForm.patchValue({
      title: goal.title,
      target_amount: goal.target_amount,
      deadline: formattedDeadline
    });
    this.showGoalModal = true;
  }

  closeGoalModal(): void {
    this.showGoalModal = false;
    this.editingGoal = null;
    this.goalForm.reset();
  }

  saveGoal(): void {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    this.savingGoal = true;
    const formValue: SavingGoalRequest = this.goalForm.value;
    const isEdit = !!this.editingGoal;
    console.log(`[Goals] ${isEdit ? 'Updating' : 'Creating'} goal:`, formValue);

    const request$ = this.editingGoal
      ? this.goalsService.update(this.editingGoal.id, formValue)
      : this.goalsService.create(formValue);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log(`[Goals] Goal ${isEdit ? 'updated' : 'created'} successfully:`, response);
        this.savingGoal = false;
        this.closeGoalModal();
        this.loadGoals();
        SwalUtils.success(
          isEdit ? 'Meta actualizada' : 'Meta creada',
          isEdit ? 'La meta se ha actualizado correctamente' : 'La meta se ha creado correctamente'
        );
        this.triggerViewUpdate();
      },
      error: (error) => {
        console.error(`[Goals] Error ${isEdit ? 'updating' : 'creating'} goal:`, error);
        this.savingGoal = false;
        SwalUtils.error('Error', error.error?.message || 'No se pudo guardar la meta');
        this.triggerViewUpdate();
      }
    });
  }

  // Validation helpers for real-time feedback
  get titleInvalid(): boolean {
    const control = this.goalForm.get('title');
    return !!(control && control.invalid && control.touched);
  }

  get amountInvalid(): boolean {
    const control = this.goalForm.get('target_amount');
    return !!(control && control.invalid && control.touched);
  }

  get deadlineInvalid(): boolean {
    const control = this.goalForm.get('deadline');
    return !!(control && control.invalid && control.touched);
  }

  // Check if deadline is in the past
  get isDeadlinePast(): boolean {
    const deadline = this.goalForm.get('deadline')?.value;
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  }

  // Helper for custom number spinner buttons
  incrementAmount(fieldName: string, delta: number): void {
    const form = fieldName === 'amount' ? this.depositForm : this.goalForm;
    const control = form.get(fieldName);
    if (control) {
      const currentValue = parseFloat(control.value) || 0;
      const step = fieldName.includes('amount') ? 1 : 1;
      const newValue = Math.max(0, currentValue + (delta * step));
      control.setValue(parseFloat(newValue.toFixed(2)));
      control.markAsTouched();
    }
  }

  deleteGoal(id: number): void {
    console.log('[Goals] Delete goal requested:', id);
    SwalUtils.confirm(
      '¿Eliminar meta?',
      '¿Estás seguro de eliminar esta meta? Se eliminarán todos los depósitos asociados.',
      'Sí, eliminar',
      'Cancelar'
    ).then((result) => {
      if (result.isConfirmed) {
        console.log('[Goals] Deleting goal:', id);
        this.goalsService
          .delete(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              console.log('[Goals] Goal deleted successfully:', response);
              this.loadGoals();
              SwalUtils.success('Meta eliminada', 'La meta se ha eliminado correctamente');
              this.triggerViewUpdate();
            },
            error: (error) => {
              console.error('[Goals] Error deleting goal:', error);
              SwalUtils.error('Error', error.error?.message || 'No se pudo eliminar la meta');
              this.triggerViewUpdate();
            }
          });
      }
    });
  }

  openDepositsModal(goal: SavingGoal): void {
    this.selectedGoal = goal;
    this.depositForm.reset({
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    });
    this.loadDeposits(goal.id);
    this.showDepositModal = true;
  }

  closeDepositModal(): void {
    this.showDepositModal = false;
    this.selectedGoal = null;
    this.deposits = [];
    this.depositForm.reset();
  }

  loadDeposits(goalId: number): void {
    this.loadingDeposits = true;
    console.log('[Goals] Loading deposits for goal:', goalId);
    this.goalsService
      .getDeposits(goalId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[Goals] Deposits loaded:', response.data);
          this.deposits = response.data || [];
          this.loadingDeposits = false;
          this.triggerViewUpdate();
        },
        error: (error) => {
          console.error('[Goals] Error loading deposits:', error);
          this.error = 'No pudimos cargar los depósitos. Intenta nuevamente.';
          this.loadingDeposits = false;
          SwalUtils.error('Error', 'No se pudieron cargar los depósitos');
          this.triggerViewUpdate();
        }
      });
  }

  saveDeposit(): void {
    if (this.depositForm.invalid || !this.selectedGoal) {
      this.depositForm.markAllAsTouched();
      return;
    }

    this.savingDeposit = true;
    const formValue: SavingDepositRequest = this.depositForm.value;
    console.log('[Goals] Creating deposit:', formValue);

    this.goalsService
      .createDeposit(this.selectedGoal.id, formValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[Goals] Deposit created successfully:', response);
          this.savingDeposit = false;
          this.depositForm.reset({
            amount: 0,
            date: new Date().toISOString().split('T')[0]
          });
          this.loadDeposits(this.selectedGoal!.id);
          this.loadGoals();
          SwalUtils.success('Depósito creado', 'El depósito se ha registrado correctamente');
          this.triggerViewUpdate();
        },
        error: (error) => {
          console.error('[Goals] Error creating deposit:', error);
          this.savingDeposit = false;
          SwalUtils.error('Error', error.error?.message || 'No se pudo guardar el depósito');
          this.triggerViewUpdate();
        }
      });
  }

  handleDepositAction(event: { action: string; row: SavingDeposit }): void {
    if (event.action === 'delete' && this.selectedGoal) {
      SwalUtils.confirm(
        '¿Eliminar depósito?',
        '¿Estás seguro de eliminar este depósito?',
        'Sí, eliminar',
        'Cancelar'
      ).then((result) => {
        if (result.isConfirmed) {
          console.log('[Goals] Deleting deposit:', event.row.id);
          this.goalsService
            .deleteDeposit(this.selectedGoal!.id, event.row.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (response) => {
                console.log('[Goals] Deposit deleted successfully:', response);
                this.loadDeposits(this.selectedGoal!.id);
                this.loadGoals();
                SwalUtils.success('Depósito eliminado', 'El depósito se ha eliminado correctamente');
                this.triggerViewUpdate();
              },
              error: (error) => {
                console.error('[Goals] Error deleting deposit:', error);
                SwalUtils.error('Error', error.error?.message || 'No se pudo eliminar el depósito');
                this.triggerViewUpdate();
              }
            });
        }
      });
    }
  }

  getProgressPercentage(goal: SavingGoal): number {
    return goal.progress_percentage ?? 0;
  }

  getDaysRemaining(goal: SavingGoal): number {
    const deadline = new Date(goal.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const diff = deadline.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getProgressColor(goal: SavingGoal): string {
    const progress = this.getProgressPercentage(goal);
    if (progress >= 100) return '#10b981';
    if (progress >= 75) return '#22c55e';
    if (progress >= 50) return '#84cc16';
    if (progress >= 25) return '#f59e0b';
    return '#ef4444';
  }

  getTotalDeposits(goal: SavingGoal): number {
    return goal.total_saved ?? 0;
  }

  getRemainingAmount(goal: SavingGoal): number {
    return Math.max(0, goal.target_amount - this.getTotalDeposits(goal));
  }

  get minProgress(): typeof Math.min {
    return Math.min;
  }

  private triggerViewUpdate(): void {
    // Use setTimeout to ensure we're outside Angular's change detection cycle
    setTimeout(() => {
      const viewRef = this.cdr as ViewRef;
      if (!viewRef.destroyed) {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    }, 0);
  }
}
