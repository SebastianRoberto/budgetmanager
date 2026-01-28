import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { CategoriesService } from '../../core/services/categories.service';
import { Category, CategoryRequest } from '../../core/models/category.model';
import {
  DataTableComponent,
  TableAction,
  TableColumn
} from '../../shared/components/data-table/data-table.component';
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';
import { SwalUtils } from '../../core/utils/swal';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SidebarComponent,
    NavbarComponent,
    DataTableComponent,
    FormModalComponent
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  categories: Category[] = [];
  loading = false;
  submitting = false;

  showModal = false;
  editingCategory: Category | null = null;

  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    monthly_limit: [null as number | null, [Validators.min(0)]]
  });

  readonly tableColumns: TableColumn<Category>[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'monthly_limit', label: 'Límite mensual', type: 'currency' },
    {
      key: 'created_at',
      label: 'Creada',
      type: 'date'
    }
  ];

  readonly tableActions: TableAction<Category>[] = [
    { key: 'edit', label: 'Editar', icon: '✏️', color: 'ghost' },
    { key: 'delete', label: 'Eliminar', icon: '🗑', color: 'danger' }
  ];

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.loading = true;
    console.log('[Categories] Loading categories...');
    this.categoriesService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[Categories] Categories loaded:', response.data);
          this.categories = response.data;
          this.loading = false;
          this.markForViewUpdate();
        },
        error: (error) => {
          console.error('[Categories] Error loading categories:', error);
          this.loading = false;
          SwalUtils.error('Error', 'No se pudieron cargar las categorías');
          this.markForViewUpdate();
        }
      });
  }

  openModal(category?: Category): void {
    this.editingCategory = category ?? null;
    this.categoryForm.reset({
      name: category?.name ?? '',
      monthly_limit: category?.monthly_limit ?? null
    });
    this.showModal = true;
  }

  closeModal(): void {
    if (this.submitting) return;
    this.showModal = false;
    this.editingCategory = null;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const payload = this.categoryForm.getRawValue() as CategoryRequest;
    if (!payload.monthly_limit) {
      payload.monthly_limit = null;
    }

    this.submitting = true;
    const isEdit = !!this.editingCategory;
    console.log(`[Categories] ${isEdit ? 'Updating' : 'Creating'} category:`, payload);

    const request$ = this.editingCategory
      ? this.categoriesService.update(this.editingCategory.id, payload)
      : this.categoriesService.create(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log(`[Categories] Category ${isEdit ? 'updated' : 'created'} successfully:`, response);
        this.submitting = false;
        this.closeModal();
        this.loadCategories();
        SwalUtils.success(
          isEdit ? 'Categoría actualizada' : 'Categoría creada',
          isEdit
            ? 'La categoría se ha actualizado correctamente'
            : 'La categoría se ha creado correctamente'
        );
        this.markForViewUpdate();
      },
      error: (error) => {
        console.error(`[Categories] Error ${isEdit ? 'updating' : 'creating'} category:`, error);
        this.submitting = false;
        SwalUtils.error(
          'Error',
          error.error?.message || `No se pudo ${isEdit ? 'actualizar' : 'crear'} la categoría`
        );
        this.markForViewUpdate();
      }
    });
  }

  handleTableAction(event: { action: string; row: Category }): void {
    if (event.action === 'edit') {
      this.openModal(event.row);
    }

    if (event.action === 'delete') {
      this.deleteCategory(event.row);
    }
  }

  deleteCategory(category: Category): void {
    console.log('[Categories] Delete category requested:', category);
    SwalUtils.confirm(
      '¿Eliminar categoría?',
      `Eliminar la categoría "${category.name}" dejará las transacciones existentes sin categoría. ¿Deseas continuar?`,
      'Sí, eliminar',
      'Cancelar'
    ).then((result) => {
      if (result.isConfirmed) {
        console.log('[Categories] Deleting category:', category.id);
        this.categoriesService
          .delete(category.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              console.log('[Categories] Category deleted successfully:', response);
              this.loadCategories();
              SwalUtils.success('Categoría eliminada', 'La categoría se ha eliminado correctamente');
              this.markForViewUpdate();
            },
            error: (error) => {
              console.error('[Categories] Error deleting category:', error);
              SwalUtils.error('Error', error.error?.message || 'No se pudo eliminar la categoría');
              this.markForViewUpdate();
            }
          });
      }
    });
  }

  get formTitle(): string {
    return this.editingCategory ? 'Editar categoría' : 'Nueva categoría';
  }

  // Helper for custom number spinner buttons
  incrementAmount(fieldName: string, delta: number): void {
    const control = this.categoryForm.get(fieldName);
    if (control) {
      const currentValue = parseFloat(control.value) || 0;
      const newValue = Math.max(0, currentValue + delta);
      control.setValue(parseFloat(newValue.toFixed(2)));
      control.markAsTouched();
    }
  }

  private markForViewUpdate(): void {
    const viewRef = this.cdr as ViewRef;
    if (!viewRef.destroyed) {
      this.cdr.detectChanges();
    }
  }
}


