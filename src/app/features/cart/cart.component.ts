import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import {
  CartLine,
  CartStateService,
} from '../../core/services/cart-state.service';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { APP_ICONS } from '../../shared/icons';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './cart.component.html',
})
export class CartComponent {
  protected cart = inject(CartStateService);
  protected icons = APP_ICONS;

  clearOpen = signal(false);
  checkoutOpen = signal(false);
  shipping = 0;
  taxRate = 0.1;

  tax = computed(() => this.cart.subtotal() * this.taxRate);
  total = computed(() => this.cart.subtotal() + this.tax() + this.shipping);

  inc(line: CartLine): void {
    this.cart.setQuantity(line.productId, line.quantity + 1);
  }

  dec(line: CartLine): void {
    this.cart.setQuantity(line.productId, line.quantity - 1);
  }

  remove(line: CartLine): void {
    this.cart.remove(line.productId);
  }

  askClear(): void {
    if (this.cart.count() === 0) return;
    this.clearOpen.set(true);
  }

  confirmClear(): void {
    this.cart.clear();
    this.clearOpen.set(false);
  }

  cancelClear(): void {
    this.clearOpen.set(false);
  }

  checkout(): void {
    this.checkoutOpen.set(true);
  }

  confirmCheckout(): void {
    this.cart.clear();
    this.checkoutOpen.set(false);
  }

  cancelCheckout(): void {
    this.checkoutOpen.set(false);
  }

  trackByLine = (_: number, l: CartLine): number => l.productId;
}
