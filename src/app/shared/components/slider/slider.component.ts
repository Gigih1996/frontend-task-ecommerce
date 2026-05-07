import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Slide } from '../../../core/models/slide.model';
import { APP_ICONS } from '../../icons';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './slider.component.html',
})
export class SliderComponent implements OnInit, OnDestroy {
  @Input({ required: true }) slides: Slide[] = [];
  @Input() autoPlay = true;
  @Input() intervalMs = 5000;

  protected icons = APP_ICONS;

  current = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    if (this.autoPlay && this.slides.length > 1) this.start();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  go(index: number): void {
    if (!this.slides.length) return;
    const next = (index + this.slides.length) % this.slides.length;
    this.current.set(next);
    this.restart();
  }

  next(): void {
    this.go(this.current() + 1);
  }

  prev(): void {
    this.go(this.current() - 1);
  }

  trackBySlide = (_: number, s: Slide): number => s.id;

  private start(): void {
    this.timer = setInterval(() => this.next(), this.intervalMs);
  }
  private stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  private restart(): void {
    if (!this.autoPlay) return;
    this.stop();
    this.start();
  }
}
