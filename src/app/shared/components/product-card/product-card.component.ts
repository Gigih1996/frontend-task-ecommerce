import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Product } from '../../../core/models/product.model';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { APP_ICONS } from '../../icons';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    RatingStarsComponent,
    ImgFallbackDirective,
  ],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  protected icons = APP_ICONS;
  liked = signal(false);

  toggleLike(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.liked.update((v) => !v);
  }
}
