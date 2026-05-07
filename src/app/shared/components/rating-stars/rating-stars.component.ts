import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { APP_ICONS } from '../../icons';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './rating-stars.component.html',
})
export class RatingStarsComponent {
  @Input() set rating(v: number) {
    this._rating.set(v ?? 0);
  }
  @Input() count: number | null = null;
  @Input() showCount = true;

  protected icons = APP_ICONS;

  private _rating = signal(0);
  filled = computed(() => Math.round(this._rating()));
  stars = signal([1, 2, 3, 4, 5]);

  ariaLabel = computed(() => `Rating ${this._rating().toFixed(1)} out of 5`);

  trackByIndex = (i: number): number => i;
}
