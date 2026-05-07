import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/product.model';

const STORAGE_KEY = 'shopease_cart';

export interface CartLine {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
}

/**
 * Client-side cart state. The dummyjson `/carts/add` endpoint is purely
 * simulated (not persisted), so we keep cart items locally in localStorage
 * and expose them as signals for reactive consumers (badge, cart page).
 */
@Injectable({ providedIn: 'root' })
export class CartStateService {
  private readonly _items = signal<CartLine[]>(this.read());

  readonly items = this._items.asReadonly();

  readonly count = computed(() =>
    this._items().reduce((sum, line) => sum + line.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this._items().reduce((sum, line) => sum + line.price * line.quantity, 0)
  );

  add(product: Product, quantity = 1): void {
    if (quantity < 1) return;
    this._items.update((lines) => {
      const idx = lines.findIndex((l) => l.productId === product.id);
      if (idx === -1) {
        return [
          ...lines,
          {
            productId: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            quantity,
          },
        ];
      }
      const next = [...lines];
      next[idx] = {
        ...next[idx],
        quantity: Math.min(next[idx].quantity + quantity, product.stock),
      };
      return next;
    });
    this.persist();
  }

  setQuantity(productId: number, quantity: number): void {
    if (quantity < 1) {
      this.remove(productId);
      return;
    }
    this._items.update((lines) =>
      lines.map((l) => (l.productId === productId ? { ...l, quantity } : l))
    );
    this.persist();
  }

  remove(productId: number): void {
    this._items.update((lines) =>
      lines.filter((l) => l.productId !== productId)
    );
    this.persist();
  }

  clear(): void {
    this._items.set([]);
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
    } catch {
      /* quota exceeded — ignore */
    }
  }

  private read(): CartLine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  }
}
