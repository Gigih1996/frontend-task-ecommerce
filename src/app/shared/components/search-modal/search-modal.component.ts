import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  EMPTY,
  tap,
} from 'rxjs';

import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { APP_ICONS } from '../../icons';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, ImgFallbackDirective],
  templateUrl: './search-modal.component.html',
})
export class SearchModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  private productService = inject(ProductService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  protected icons = APP_ICONS;

  query = signal('');
  results = signal<Product[]>([]);
  loading = signal(false);
  searched = signal(false);

  private query$ = new Subject<string>();

  ngOnInit(): void {
    this.query$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap((q) => {
          this.searched.set(true);
          if (!q.trim()) {
            this.results.set([]);
            this.loading.set(false);
            return;
          }
          this.loading.set(true);
        }),
        switchMap((q) =>
          q.trim()
            ? this.productService
                .searchProducts(q.trim(), { limit: 8 })
                .pipe(catchError(() => { this.loading.set(false); return EMPTY; }))
            : EMPTY
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.results.set(res.products);
        this.loading.set(false);
      });

    // Focus input after modal animates in
    setTimeout(() => this.searchInputRef?.nativeElement.focus(), 80);
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    if (!value.trim()) {
      this.results.set([]);
      this.searched.set(false);
      this.loading.set(false);
    }
    this.query$.next(value);
  }

  goToProduct(id: number): void {
    this.close();
    this.router.navigate(['/product', id]);
  }

  goToAllResults(): void {
    this.close();
    this.router.navigate(['/products'], {
      queryParams: { q: this.query() },
    });
  }

  close(): void {
    this.closed.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  trackByProduct = (_: number, p: Product): number => p.id;
}
