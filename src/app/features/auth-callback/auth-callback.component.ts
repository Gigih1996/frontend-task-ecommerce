import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../core/services/auth.service';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { APP_ICONS } from '../../shared/icons';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, LoaderComponent],
  templateUrl: './auth-callback.component.html',
})
export class AuthCallbackComponent implements OnInit {
  private auth = inject(AuthService);
  private google = inject(GoogleAuthService);
  private router = inject(Router);

  protected icons = APP_ICONS;
  errorMessage = signal('');

  ngOnInit(): void {
    try {
      const result = this.google.consumeRedirectCallback(window.location.hash);
      this.auth.loginWithGoogle(result.payload, result.rawCredential);
      this.router.navigateByUrl(result.redirectAfterLogin, {
        replaceUrl: true,
      });
    } catch (err) {
      this.errorMessage.set(
        err instanceof Error ? err.message : 'Google sign-in failed.'
      );
    }
  }
}
