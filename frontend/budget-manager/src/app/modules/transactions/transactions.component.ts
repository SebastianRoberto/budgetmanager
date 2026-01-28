import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import {
  TransactionsService,
  TransactionFilters,
  TransactionListResponse
} from '../../core/services/transactions.service';
import { CategoriesService } from '../../core/services/categories.service';
import { Transaction, TransactionRequest, TransactionType } from '../../core/models/transaction.model';
import { Category } from '../../core/models/category.model';
import {
  DataTableComponent,
  TableAction,
  TableColumn
} from '../../shared/components/data-table/data-table.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';
import { SwalUtils } from '../../core/utils/swal';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SidebarComponent,
    NavbarComponent,
    CardComponent,
    DataTableComponent,
    FormModalComponent
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly transactionsService = inject(TransactionsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

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

  categories: Category[] = [];
  transactions: Transaction[] = [];
  summary = { total_income: 0, total_expense: 0, balance: 0 };
  pagination = { current_page: 1, last_page: 1, per_page: 10, total: 0 };

  loadingTable = false;
  loadingCategories = false;
  submitting = false;

  showModal = false;
  editingTransaction: Transaction | null = null;

  readonly filterForm = this.fb.nonNullable.group({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    type: '' as '' | 'income' | 'expense',
    category_id: null as number | null
  });

  readonly transactionForm = this.fb.nonNullable.group({
    type: 'expense' as 'income' | 'expense',
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    category_id: null as number | null,
    date: new Date().toISOString().split('T')[0],
    description: ['']
  });

  readonly tableColumns: TableColumn<Transaction>[] = [
    { key: 'date', label: 'Fecha', type: 'date' },
    {
      key: 'type',
      label: 'Tipo',
      type: 'badge',
      badgeColorFn: (row) => (row.type === 'income' ? 'success' : 'danger'),
      formatter: (value) => (value === 'income' ? 'Ingreso' : 'Gasto')
    },
    {
      key: 'category',
      label: 'Categoría',
      formatter: (_value, row) => row.category?.name ?? '—'
    },
    {
      key: 'amount',
      label: 'Monto',
      type: 'currency',
      align: 'right'
    },
    {
      key: 'description',
      label: 'Descripción'
    }
  ];

  readonly tableActions: TableAction<Transaction>[] = [
    { key: 'edit', label: 'Editar', icon: '✏️', color: 'ghost' },
    { key: 'delete', label: 'Eliminar', icon: '🗑', color: 'danger' }
  ];

  get formTitle(): string {
    return this.editingTransaction ? 'Editar transacción' : 'Nueva transacción';
  }

  get typeIsExpense(): boolean {
    return this.transactionForm.controls.type.value === 'expense';
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadTransactions();

    // Subscribe to reactive transactions updates
    this.transactionsService.transactions$.pipe(takeUntil(this.destroy$)).subscribe(transactions => {
      if (transactions.length > 0 || this.transactions.length > 0) {
        this.transactions = transactions;
        this.triggerViewUpdate();
      }
    });

    this.transactionsService.summary$.pipe(takeUntil(this.destroy$)).subscribe(summary => {
      if (summary) {
        this.summary = {
          total_income: summary.total_income ?? 0,
          total_expense: summary.total_expense ?? 0,
          balance: summary.balance ?? 0
        };
        this.triggerViewUpdate();
      }
    });

    // Auto-apply filters with debounce
    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('[Transactions] Filters changed, auto-applying...');
      this.loadTransactions(1);
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

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoriesService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.categories = response.data;
          this.loadingCategories = false;
          this.triggerViewUpdate();
        },
        error: () => {
          this.loadingCategories = false;
          this.triggerViewUpdate();
        }
      });
  }

  loadTransactions(page = 1): void {
    this.loadingTable = true;
    const formValue = this.filterForm.getRawValue();
    const filters: TransactionFilters & { page?: number; per_page?: number } = {
      ...formValue,
      type: formValue.type === '' ? undefined : (formValue.type as TransactionType),
      category_id: formValue.category_id ? Number(formValue.category_id) : undefined,
      page,
      per_page: this.pagination.per_page
    };

    this.transactionsService
      .getAll(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: TransactionListResponse) => {
          this.transactions = response.data;
          this.pagination = {
            current_page: response.pagination.current_page,
            last_page: response.pagination.last_page,
            per_page: response.pagination.per_page,
            total: response.pagination.total
          };
          this.summary = {
            total_income: response.summary?.total_income ?? 0,
            total_expense: response.summary?.total_expense ?? 0,
            balance: response.summary?.balance ?? 0
          };
          this.loadingTable = false;
          this.triggerViewUpdate();
        },
        error: () => {
          this.loadingTable = false;
          this.triggerViewUpdate();
        }
      });
  }

  applyFilters(): void {
    this.loadTransactions(1);
  }

  clearFilters(): void {
    this.filterForm.reset({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      type: '',
      category_id: null
    });
  }

  handleTableAction(event: { action: string; row: Transaction }): void {
    if (event.action === 'edit') {
      this.openModal(event.row);
    }
    if (event.action === 'delete') {
      this.deleteTransaction(event.row);
    }
  }

  openModal(transaction?: Transaction): void {
    this.editingTransaction = transaction ?? null;

    // Format date to YYYY-MM-DD for date input
    let formattedDate = new Date().toISOString().split('T')[0];
    if (transaction?.date) {
      const date = new Date(transaction.date);
      formattedDate = date.toISOString().split('T')[0];
    }

    this.transactionForm.reset({
      type: transaction?.type ?? 'expense',
      amount: transaction?.amount ?? null,
      category_id: transaction?.category_id ?? null,
      date: formattedDate,
      description: transaction?.description ?? ''
    });
    this.showModal = true;
  }

  closeModal(): void {
    if (this.submitting) {
      return;
    }
    this.showModal = false;
    this.editingTransaction = null;
  }

  saveTransaction(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    const payload = this.transactionForm.getRawValue() as TransactionRequest;
    if (!payload.category_id) {
      payload.category_id = null;
    }

    this.submitting = true;
    const isEdit = !!this.editingTransaction;

    const request$ = this.editingTransaction
      ? this.transactionsService.update(this.editingTransaction.id, payload)
      : this.transactionsService.create(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModal();
        SwalUtils.success(
          isEdit ? 'Transacción actualizada' : 'Transacción creada',
          isEdit ? 'La transacción se ha actualizado correctamente' : 'La transacción se ha creado correctamente'
        );
      },
      error: (error) => {
        this.submitting = false;
        SwalUtils.error('Error', error.error?.message || `No se pudo ${isEdit ? 'actualizar' : 'crear'} la transacción`);
      }
    });
  }

  deleteTransaction(transaction: Transaction): void {
    SwalUtils.confirm(
      '¿Eliminar transacción?',
      `¿Estás seguro de eliminar esta transacción de $${transaction.amount}?`,
      'Sí, eliminar',
      'Cancelar'
    ).then((result) => {
      if (result.isConfirmed) {
        this.transactionsService
          .delete(transaction.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              SwalUtils.success('Transacción eliminada', 'La transacción se ha eliminado correctamente');
            },
            error: (error) => {
              SwalUtils.error('Error', error.error?.message || 'No se pudo eliminar la transacción');
            }
          });
      }
    });
  }

  goToPage(direction: 'prev' | 'next'): void {
    if (direction === 'prev' && this.pagination.current_page > 1) {
      this.loadTransactions(this.pagination.current_page - 1);
    }
    if (direction === 'next' && this.pagination.current_page < this.pagination.last_page) {
      this.loadTransactions(this.pagination.current_page + 1);
    }
  }

  // Helper for custom number spinner buttons
  incrementAmount(fieldName: string, delta: number): void {
    const control = this.transactionForm.get(fieldName);
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
