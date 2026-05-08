import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, EMPTY } from 'rxjs';

import { ProductService } from '../../core/services/product.service';
import { ProductCategory } from '../../core/models/product.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { APP_ICONS } from '../../shared/icons';

const CATEGORY_GRADIENTS = [
  'from-blue-100 to-indigo-200',
  'from-rose-100 to-pink-200',
  'from-amber-100 to-orange-200',
  'from-emerald-100 to-teal-200',
  'from-violet-100 to-purple-200',
  'from-sky-100 to-cyan-200',
  'from-lime-100 to-green-200',
  'from-red-100 to-rose-200',
];

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    LoaderComponent,
  ],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  protected icons = APP_ICONS;

  loading = signal(true);
  categories = signal<ProductCategory[]>([]);

  ngOnInit(): void {
    this.productService
      .getCategories()
      .pipe(
        catchError(() => { this.loading.set(false); return EMPTY; }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((list) => {
        this.categories.set(list);
        this.loading.set(false);
      });
  }

  goToProducts(slug: string): void {
    this.router.navigate(['/products'], { queryParams: { category: slug } });
  }

  gradientFor(index: number): string {
    return CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
  }

  trackByCategory = (_: number, c: ProductCategory): string => c.slug;
}
