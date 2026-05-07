import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  switchMap,
  tap,
} from 'rxjs';

import { ProductService } from '../../core/services/product.service';
import { CartStateService } from '../../core/services/cart-state.service';
import { Product } from '../../core/models/product.model';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../shared/components/rating-stars/rating-stars.component';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';
import { APP_ICONS } from '../../shared/icons';

type Tab = 'description' | 'specifications' | 'reviews';

interface ColorSwatch {
  name: string;
  hex: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    LoaderComponent,
    RatingStarsComponent,
    ImgFallbackDirective,
  ],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cart = inject(CartStateService);
  private destroyRef = inject(DestroyRef);

  protected icons = APP_ICONS;

  loading = signal(true);
  product = signal<Product | null>(null);
  selectedImage = signal<string>('');
  quantity = signal(1);
  activeTab = signal<Tab>('description');
  errorMessage = signal('');
  justAdded = signal(false);
  selectedColor = signal<string>('');

  /** Decorative colors — dummyjson products have no color field, so we synthesize a stable trio per product. */
  colors = computed<ColorSwatch[]>(() => {
    const p = this.product();
    if (!p) return [];
    return this.deriveColors(p.id);
  });

  totalPrice = computed(() => {
    const p = this.product();
    return p ? p.price * this.quantity() : 0;
  });

  features = computed<string[]>(() => {
    const p = this.product();
    if (!p) return [];
    return [
      p.warrantyInformation,
      p.shippingInformation,
      p.returnPolicy,
      `Minimum order quantity: ${p.minimumOrderQuantity}`,
      `Availability: ${p.availabilityStatus}`,
    ].filter(Boolean);
  });

  ngOnInit(): void {
    /**
     * Pattern: paramMap → switchMap → http.
     *  • takeUntilDestroyed → no leaked subscriptions (no manual unsubscribe).
     *  • filter → drop empty ids (route was edited to `/product/`).
     *  • distinctUntilChanged → don't refetch when paramMap re-emits same id
     *    (e.g. after queryParam change, route reuse).
     *  • switchMap → if user navigates to a different product mid-flight,
     *    cancel the previous request — only the latest matters.
     *  • catchError per fetch → service-level errors don't kill the outer
     *    stream so subsequent navigations still work.
     */
    this.route.paramMap
      .pipe(
        map((p) => p.get('id')),
        filter((id): id is string => !!id),
        distinctUntilChanged(),
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set('');
        }),
        switchMap((id) =>
          this.productService.getProduct(id).pipe(
            catchError(() => {
              this.errorMessage.set('Product not found.');
              this.loading.set(false);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((p) => {
        this.product.set(p);
        this.selectedImage.set(p.thumbnail || p.images[0] || '');
        this.quantity.set(1);
        const swatches = this.deriveColors(p.id);
        this.selectedColor.set(swatches[0]?.hex ?? '');
        this.loading.set(false);
      });
  }

  selectImage(img: string): void {
    this.selectedImage.set(img);
  }

  selectColor(hex: string): void {
    this.selectedColor.set(hex);
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  inc(): void {
    const p = this.product();
    if (!p) return;
    this.quantity.update((q) => Math.min(q + 1, p.stock));
  }
  dec(): void {
    this.quantity.update((q) => Math.max(q - 1, 1));
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cart.add(p, this.quantity());
    this.justAdded.set(true);
    setTimeout(() => this.justAdded.set(false), 1500);
  }

  trackByImage = (i: number, _: string): number => i;
  trackByReview = (i: number): number => i;
  trackByColor = (_: number, c: ColorSwatch): string => c.hex;
  trackByFeature = (_: number, f: string): string => f;

  /**
   * Pick 3 stable colors per product id from a curated palette.
   * Uses simple modular hashing so the same product always shows the same swatches.
   */
  private deriveColors(seed: number): ColorSwatch[] {
    const palette: ColorSwatch[] = [
      { name: 'Black', hex: '#1f2937' },
      { name: 'Gray', hex: '#9ca3af' },
      { name: 'Navy', hex: '#1e3a8a' },
      { name: 'Olive', hex: '#65a30d' },
      { name: 'Burgundy', hex: '#9f1239' },
      { name: 'Cream', hex: '#f5f5dc' },
      { name: 'Rose', hex: '#fb7185' },
      { name: 'Teal', hex: '#0d9488' },
    ];
    const start = seed % palette.length;
    return [
      palette[start],
      palette[(start + 3) % palette.length],
      palette[(start + 5) % palette.length],
    ];
  }
}
