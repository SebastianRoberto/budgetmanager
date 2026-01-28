import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './form-modal.component.html',
  styleUrl: './form-modal.component.scss'
})
export class FormModalComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() submitLabel = 'Guardar';
  @Input() cancelLabel = 'Cancelar';
  @Input() show = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() submitting = false;
  @Input() disableSubmit = false;

  @Output() submitted = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  onSubmit(): void {
    if (this.disableSubmit || this.submitting) {
      return;
    }
    this.submitted.emit();
  }

  onClose(): void {
    if (this.submitting) {
      return;
    }
    this.closed.emit();
  }
}


