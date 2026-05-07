import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { APP_ICONS, AppIconName } from '../../icons';

export type ConfirmTone = 'danger' | 'primary';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Are you sure?';
  @Input() message = '';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() tone: ConfirmTone = 'primary';
  @Input() icon: AppIconName = 'AlertCircle';
  @Input() loading = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  protected icons = APP_ICONS;

  onConfirm(): void {
    if (!this.loading) this.confirm.emit();
  }
  onCancel(): void {
    if (!this.loading) this.cancel.emit();
  }
  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.onCancel();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.onCancel();
  }
}
