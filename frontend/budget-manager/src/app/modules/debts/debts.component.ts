import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { DataTableComponent, TableColumn, TableAction } from '../../shared/components/data-table/data-table.component';
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { DebtsService } from '../../core/services/debts.service';
import { Debt, DebtType, DebtStatus } from '../../core/models/debt.model';
import { SwalUtils } from '../../core/utils/swal';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    NavbarComponent,
    DataTableComponent,
    FormModalComponent,
    CardComponent
  ],
  templateUrl: './debts.component.html',
  styleUrl: './debts.component.scss'
})
export class DebtsComponent implements OnInit, OnDestroy {
  private readonly debtsService = inject(DebtsService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  activeTab: 'outgoing' | 'incoming' = 'outgoing';
  debts: Debt[] = [];
  filteredDebts: Debt[] = [];
  loading = false;
  error: string | null = null;

  showModal = false;
  editingDebt: Debt | null = null;
  saving = false;
  debtForm: FormGroup;

  readonly tableColumns: TableColumn<Debt>[] = [
    { key: 'person', label: 'Persona' },
    {
      key: 'amount',
      label: 'Monto',
      type: 'currency',
      align: 'right'
    },
    {
      key: 'due_date',
      label: 'Fecha límite',
      type: 'date'
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      badgeColorFn: (row) => this.getStatusBadgeColor(row.status),
      formatter: (value) => this.formatStatus(value as DebtStatus)
    },
    { key: 'description', label: 'Descripción' }
  ];

  readonly tableActions: TableAction<Debt>[] = [
    { key: 'edit', label: 'Editar', icon: '✏️' },
    { key: 'delete', label: 'Eliminar', icon: '🗑️', color: 'danger' }
  ];

  constructor() {
    this.debtForm = this.fb.group({
      type: ['outgoing', [Validators.required]],
      person: ['', [Validators.required, Validators.minLength(2)]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      due_date: ['', [Validators.required]],
      status: ['pending', [Validators.required]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadDebts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDebts(): void {
    this.loading = true;
    this.error = null;
    console.log('[Debts] Loading debts...');

    this.debtsService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[Debts] Debts loaded:', response.data);
          this.debts = response.data || [];
          this.filterDebts();
          this.loading = false;
          this.triggerViewUpdate();
        },
        error: (error) => {
          console.error('[Debts] Error loading debts:', error);
          this.error = 'No pudimos cargar las deudas. Intenta nuevamente.';
          this.loading = false;
          SwalUtils.error('Error', 'No se pudieron cargar las deudas');
          this.triggerViewUpdate();
        }
      });
  }

  switchTab(tab: 'outgoing' | 'incoming'): void {
    this.activeTab = tab;
    this.filterDebts();
  }

  filterDebts(): void {
    this.filteredDebts = this.debts.filter((debt) => debt.type === this.activeTab);
  }

  openCreateModal(): void {
    this.editingDebt = null;
    this.debtForm.reset({
      type: this.activeTab,
      person: '',
      amount: 0,
      due_date: '',
      status: 'pending',
      description: ''
    });
    this.showModal = true;
  }

  openEditModal(debt: Debt): void {
    this.editingDebt = debt;

    // Format due_date to YYYY-MM-DD for date input
    let formattedDueDate = debt.due_date;
    if (debt.due_date) {
      const date = new Date(debt.due_date);
      formattedDueDate = date.toISOString().split('T')[0];
    }

    this.debtForm.patchValue({
      type: debt.type,
      person: debt.person,
      amount: debt.amount,
      due_date: formattedDueDate,
      status: debt.status,
      description: debt.description || ''
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingDebt = null;
    this.debtForm.reset();
  }

  saveDebt(): void {
    if (this.debtForm.invalid) {
      this.debtForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValue = this.debtForm.value;
    const isEdit = !!this.editingDebt;
    console.log(`[Debts] ${isEdit ? 'Updating' : 'Creating'} debt:`, formValue);

    const request$ = this.editingDebt
      ? this.debtsService.update(this.editingDebt.id, formValue)
      : this.debtsService.create(formValue);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log(`[Debts] Debt ${isEdit ? 'updated' : 'created'} successfully:`, response);
        this.saving = false;
        this.closeModal();
        this.loadDebts();
        SwalUtils.success(
          isEdit ? 'Deuda actualizada' : 'Deuda creada',
          isEdit ? 'La deuda se ha actualizado correctamente' : 'La deuda se ha creado correctamente'
        );
        this.triggerViewUpdate();
      },
      error: (error) => {
        console.error(`[Debts] Error ${isEdit ? 'updating' : 'creating'} debt:`, error);
        this.saving = false;
        SwalUtils.error('Error', error.error?.message || 'No se pudo guardar la deuda');
        this.triggerViewUpdate();
      }
    });
  }

  handleTableAction(event: { action: string; row: Debt }): void {
    if (event.action === 'edit') {
      this.openEditModal(event.row);
    } else if (event.action === 'delete') {
      SwalUtils.confirm(
        '¿Eliminar deuda?',
        `¿Estás seguro de eliminar la deuda con ${event.row.person}?`,
        'Sí, eliminar',
        'Cancelar'
      ).then((result) => {
        if (result.isConfirmed) {
          this.deleteDebt(event.row.id);
        }
      });
    }
  }

  deleteDebt(id: number): void {
    console.log('[Debts] Deleting debt:', id);
    this.debtsService
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[Debts] Debt deleted successfully:', response);
          this.loadDebts();
          SwalUtils.success('Deuda eliminada', 'La deuda se ha eliminado correctamente');
          this.triggerViewUpdate();
        },
        error: (error) => {
          console.error('[Debts] Error deleting debt:', error);
          SwalUtils.error('Error', error.error?.message || 'No se pudo eliminar la deuda');
          this.triggerViewUpdate();
        }
      });
  }

  getStatusBadgeColor(status: DebtStatus): 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'info';
      case 'late':
        return 'danger';
      default:
        return 'info';
    }
  }

  formatStatus(status: DebtStatus): string {
    const map: Record<DebtStatus, string> = {
      pending: 'Pendiente',
      paid: 'Pagada',
      late: 'Vencida'
    };
    return map[status] || status;
  }

  get outgoingDebts(): Debt[] {
    return this.debts.filter((d) => d.type === 'outgoing');
  }

  get incomingDebts(): Debt[] {
    return this.debts.filter((d) => d.type === 'incoming');
  }

  get totalOutgoing(): number {
    return this.outgoingDebts
      .filter((d) => d.status !== 'paid')
      .reduce((sum, d) => sum + Number(d.amount), 0);
  }

  get totalIncoming(): number {
    return this.incomingDebts
      .filter((d) => d.status !== 'paid')
      .reduce((sum, d) => sum + Number(d.amount), 0);
  }

  get lateDebtsCount(): number {
    return this.debts.filter((d) => d.status === 'late').length;
  }

  // Helper for custom number spinner buttons
  incrementAmount(fieldName: string, delta: number): void {
    const control = this.debtForm.get(fieldName);
    if (control) {
      const currentValue = parseFloat(control.value) || 0;
      const newValue = Math.max(0, currentValue + delta);
      control.setValue(parseFloat(newValue.toFixed(2)));
      control.markAsTouched();
    }
  }

  private triggerViewUpdate(): void {
    const viewRef = this.cdr as ViewRef;
    if (!viewRef.destroyed) {
      this.cdr.detectChanges();
    }
  }
}
