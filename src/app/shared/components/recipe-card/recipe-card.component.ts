import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Recipe } from '../../../core/models/recipe.model';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { APP_ICONS } from '../../icons';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    RatingStarsComponent,
    ImgFallbackDirective,
  ],
  templateUrl: './recipe-card.component.html',
})
export class RecipeCardComponent {
  @Input({ required: true }) recipe!: Recipe;

  protected icons = APP_ICONS;

  get totalTime(): number {
    return (this.recipe.prepTimeMinutes ?? 0) + (this.recipe.cookTimeMinutes ?? 0);
  }
}
