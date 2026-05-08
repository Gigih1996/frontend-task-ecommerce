import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, EMPTY } from 'rxjs';

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
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    SliderComponent,
    ProductGridComponent,
  ],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  protected icons = APP_ICONS;

  loading = signal(true);
  products = signal<Product[]>([]);
  activeCategory = signal('all');
  showingAll = signal(false);

  slides: Slide[] = [
    {
      id: 1,
      title: 'Discover Style That Inspires',
      subtitle: 'New Collection 2024',
      description: 'Browse our latest collection of premium products crafted for you.',
      ctaText: 'Shop Now',
      ctaLink: '#products',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format&fit=crop',
      bgClass: 'bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-50',
    },
    {
      id: 2,
      title: 'Elevate Your Everyday',
      subtitle: 'Featured Picks',
      description: 'Hand-picked bestsellers to upgrade your daily essentials.',
      ctaText: 'Explore',
      ctaLink: '#products',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop',
      bgClass: 'bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50',
    },
    {
      id: 3,
      title: 'Tech for the Modern Life',
      subtitle: 'Smart Gadgets',
      description: 'Discover smartphones, laptops, and accessories at the best prices.',
      ctaText: 'Browse Tech',
      ctaLink: '#products',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80&auto=format&fit=crop',
      bgClass: 'bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-50',
    },
  ];

  ngOnInit(): void {
    // Check if navigated from categories page with ?category=slug
    const cat = this.route.snapshot.queryParamMap.get('category');
    if (cat) {
      this.activeCategory.set(cat);
      this.loadByCategory(cat);
    } else {
      this.loadFeatured();
    }
  }

  loadFeatured(): void {
    this.loading.set(true);
    this.showingAll.set(false);
    this.productService
      .getProducts({ limit: environment.defaultPageSize })
      .pipe(catchError(() => { this.loading.set(false); return EMPTY; }), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.products.set(res.products);
        this.loading.set(false);
      });
  }

  loadAll(): void {
    this.loading.set(true);
    this.showingAll.set(true);
    this.productService
      .getProducts({ limit: 100 })
      .pipe(catchError(() => { this.loading.set(false); return EMPTY; }), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.products.set(res.products);
        this.loading.set(false);
      });
  }

  clearCategory(): void {
    this.activeCategory.set('all');
    this.loadFeatured();
  }

  private loadByCategory(slug: string): void {
    this.loading.set(true);
    this.productService
      .getProductsByCategory(slug, { limit: environment.defaultPageSize })
      .pipe(catchError(() => { this.loading.set(false); return EMPTY; }), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.products.set(res.products);
        this.loading.set(false);
      });
  }
}
