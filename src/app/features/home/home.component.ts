import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { Slide } from '../../core/models/slide.model';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { SliderComponent } from '../../shared/components/slider/slider.component';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';
import { APP_ICONS } from '../../shared/icons';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    SliderComponent,
    ProductGridComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private destroyRef = inject(DestroyRef);
  protected icons = APP_ICONS;

  loading = signal(true);
  products = signal<Product[]>([]);
  categories = signal<string[]>([]);
  activeCategory = signal<string>('all');
  searchTerm = signal('');

  private query$ = new Subject<string>();

  slides: Slide[] = [
    {
      id: 1,
      title: 'Discover Style That Inspires',
      subtitle: 'New Collection 2024',
      description:
        'Browse our latest collection of premium products crafted for you.',
      ctaText: 'Shop Now',
      ctaLink: '#products',
      image:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format&fit=crop',
      bgClass: 'bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-50',
    },
    {
      id: 2,
      title: 'Elevate Your Everyday',
      subtitle: 'Featured Picks',
      description: 'Hand-picked bestsellers to upgrade your daily essentials.',
      ctaText: 'Explore',
      ctaLink: '#products',
      image:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop',
      bgClass: 'bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50',
    },
    {
      id: 3,
      title: 'Tech for the Modern Life',
      subtitle: 'Smart Gadgets',
      description:
        'Discover smartphones, laptops, and accessories at the best prices.',
      ctaText: 'Browse Tech',
      ctaLink: '#products',
      image:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80&auto=format&fit=crop',
      bgClass: 'bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-50',
    },
  ];

  ngOnInit(): void {
    this.loadCategories();

    /**
     * Single stream handles initial load, search, and clearing search.
     * `startWith('')` triggers the initial /products fetch — no separate
     * loadProducts() call, so we never accidentally double-fetch on init.
     */
    this.query$
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.loading.set(true)),
        switchMap((q) =>
          (q.trim()
            ? this.productService.searchProducts(q.trim(), {
                limit: environment.defaultPageSize,
              })
            : this.productService.getProducts({
                limit: environment.defaultPageSize,
              })
          ).pipe(
            catchError(() => {
              this.loading.set(false);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.products.set(res.products);
        this.loading.set(false);
      });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.activeCategory.set('all');
    this.query$.next(value);
  }

  filterByCategory(slug: string): void {
    if (this.activeCategory() === slug) return; // dedupe identical filter clicks
    this.activeCategory.set(slug);
    this.loading.set(true);
    const obs =
      slug === 'all'
        ? this.productService.getProducts({
            limit: environment.defaultPageSize,
          })
        : this.productService.getProductsByCategory(slug, {
            limit: environment.defaultPageSize,
          });
    obs
      .pipe(
        catchError(() => {
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.products.set(res.products);
        this.loading.set(false);
      });
  }

  trackByCategory = (_: number, c: string): string => c;

  private loadCategories(): void {
    this.productService
      .getCategoryList()
      .pipe(
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((list) => this.categories.set(list.slice(0, 8)));
  }
}
