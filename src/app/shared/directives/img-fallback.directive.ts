import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  inject,
} from '@angular/core';
import { DynamicImageService } from '../../core/services/dynamic-image.service';

/**
 * If an `<img>` fails to load, swap it with a dummyjson placeholder that
 * displays the given text. Stops looping by removing the listener after one swap.
 *
 * Example:
 *   <img [src]="product.thumbnail" [appImgFallback]="product.title" />
 */
@Directive({
  selector: 'img[appImgFallback]',
  standalone: true,
})
export class ImgFallbackDirective {
  private el = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private images = inject(DynamicImageService);

  @Input('appImgFallback') text = '';
  @Input() fallbackWidth = 600;
  @Input() fallbackHeight = 600;
  @Input() fallbackBg = 'e5e7eb'; // tailwind gray-200
  @Input() fallbackColor = '6b7280'; // tailwind gray-500

  private swapped = false;

  @HostListener('error')
  onError(): void {
    if (this.swapped) return;
    this.swapped = true;
    this.el.nativeElement.src = this.images.placeholder({
      width: this.fallbackWidth,
      height: this.fallbackHeight,
      bg: this.fallbackBg,
      color: this.fallbackColor,
      text: this.shorten(this.text || 'No image'),
    });
  }

  private shorten(text: string): string {
    return text.length > 40 ? text.slice(0, 40) + '…' : text;
  }
}
