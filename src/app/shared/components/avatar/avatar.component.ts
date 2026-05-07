import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicImageService } from '../../../core/services/dynamic-image.service';

type Stage = 'src' | 'identicon' | 'initials';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
})
export class AvatarComponent {
  private images = inject(DynamicImageService);

  @Input() src?: string | null;
  /** Used both for initials and as identicon seed. */
  @Input() name = '';
  /** Used as identicon seed if provided (more stable than name). */
  @Input() seed?: string | null;
  /** Disable the dummyjson identicon fallback (go directly to initials). */
  @Input() useIdenticon = true;
  /** tailwind size class, e.g. 'h-7 w-7' */
  @Input() sizeClass = 'h-8 w-8';
  /** tailwind text size for initials, e.g. 'text-xs' */
  @Input() textClass = 'text-xs';
  /** identicon resolution in px */
  @Input() identiconSize = 128;

  private stage = signal<Stage>('src');

  initials = computed(() =>
    this.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?'
  );

  bgClass = computed(() => {
    const palette = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-violet-500',
      'bg-cyan-500',
      'bg-pink-500',
      'bg-orange-500',
    ];
    let hash = 0;
    for (let i = 0; i < this.name.length; i++) {
      hash = (hash * 31 + this.name.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
  });

  /** What the <img> currently points at. Empty string = render initials. */
  imageUrl = computed(() => {
    const stage = this.stage();
    if (stage === 'src' && this.src) return this.src;
    if (stage === 'identicon' && this.useIdenticon) {
      return this.images.identicon(this.identiconSeed(), {
        size: this.identiconSize,
      });
    }
    return '';
  });

  showImage = computed(() => !!this.imageUrl());

  onError(): void {
    const cur = this.stage();
    if (cur === 'src' && this.useIdenticon) this.stage.set('identicon');
    else this.stage.set('initials');
  }

  private identiconSeed(): string {
    return (this.seed || this.name || 'user').toLowerCase();
  }
}
