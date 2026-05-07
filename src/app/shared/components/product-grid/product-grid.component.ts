import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/product.model';
import { ProductCardComponent } from '../product-card/product-card.component';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, LoaderComponent],
  templateUrl: './product-grid.component.html',
})
export class ProductGridComponent {
  @Input() title = '';
  @Input() products: Product[] = [];
  @Input() loading = false;
  @Input() showViewAll = false;
  @Input() emptyText = 'No products found.';
  @Input() viewAllText = 'View All';

  trackById = (_: number, p: Product): number => p.id;
}
