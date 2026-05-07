import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { APP_ICONS } from '../../icons';

type StarKind = 'full' | 'half' | 'empty';

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
  /** tailwind size class for each star */
  @Input() sizeClass = 'h-4 w-4';

  protected icons = APP_ICONS;

  private _rating = signal(0);

  /**
   * 5-element array of 'full' | 'half' | 'empty'.
   * Half is shown when fractional part is in [0.25, 0.75); above that we
   * round up to a full star so 4.8 ⇒ ★★★★★, 4.5 ⇒ ★★★★⯨, 4.2 ⇒ ★★★★☆.
   */
  stars = computed<StarKind[]>(() => {
    const r = this._rating();
    const full = Math.floor(r);
    const frac = r - full;
    const out: StarKind[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= full) out.push('full');
      else if (i === full + 1 && frac >= 0.25 && frac < 0.75) out.push('half');
      else if (i === full + 1 && frac >= 0.75) out.push('full');
      else out.push('empty');
    }
    return out;
  });

  ariaLabel = computed(() => `Rating ${this._rating().toFixed(1)} out of 5`);

  trackByIndex = (i: number): number => i;
}
