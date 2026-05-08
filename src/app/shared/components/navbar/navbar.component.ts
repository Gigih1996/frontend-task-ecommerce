import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { CartStateService } from '../../../core/services/cart-state.service';
import { APP_ICONS } from '../../icons';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { SearchModalComponent } from '../search-modal/search-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    ConfirmDialogComponent,
    AvatarComponent,
    SearchModalComponent,
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  protected auth = inject(AuthService);
  protected cart = inject(CartStateService);
  protected icons = APP_ICONS;
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  @ViewChild('userMenu', { static: false })
  userMenu?: ElementRef<HTMLElement>;

  links = [
    { path: '/home', label: 'Home' },
    { path: '/products', label: 'Products' },
    { path: '/categories', label: 'Categories' },
    { path: '/about', label: 'About Us' },
  ];

  menuOpen = signal(false);
  mobileOpen = signal(false);
  logoutOpen = signal(false);
  searchOpen = signal(false);

  constructor() {
    // Close any open dropdown / drawer / dialog on route change so leftover
    // overlays don't block clicks on the next page.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.closeAll());
  }

  toggleMenu(event?: Event): void {
    event?.stopPropagation();
    this.menuOpen.update((v) => !v);
  }

  toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }

  askLogout(): void {
    this.menuOpen.set(false);
    this.logoutOpen.set(true);
  }

  cancelLogout(): void {
    this.logoutOpen.set(false);
  }

  confirmLogout(): void {
    this.logoutOpen.set(false);
    this.auth.logout();
  }

  /** Close the avatar dropdown when clicking anywhere outside of it. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const root = this.userMenu?.nativeElement;
    if (root && !root.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  /** Esc closes the dropdown / drawer (dialog has its own handler). */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuOpen()) this.menuOpen.set(false);
    if (this.mobileOpen()) this.mobileOpen.set(false);
  }

  openSearch(): void {
    this.searchOpen.set(true);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
  }

  private closeAll(): void {
    this.menuOpen.set(false);
    this.mobileOpen.set(false);
    this.logoutOpen.set(false);
    this.searchOpen.set(false);
  }

  trackByLink = (_: number, item: { path: string; label: string }): string =>
    item.path + item.label;
}
