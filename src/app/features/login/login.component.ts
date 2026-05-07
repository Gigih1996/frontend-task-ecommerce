import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { APP_ICONS } from '../../shared/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private google = inject(GoogleAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  @ViewChild('googleBtn', { static: false })
  googleBtn?: ElementRef<HTMLDivElement>;

  protected icons = APP_ICONS;
  year = new Date().getFullYear();

  loading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  googleError = signal('');
  /** Seconds remaining before user can retry login (after 429). */
  cooldown = signal(0);
  isDisabled = computed(() => this.loading() || this.cooldown() > 0);

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.stopCooldown());
  }

  /**
   * DummyJSON auth requires a username — we accept email *or* username
   * in the same field, mark it as "email-style" if it contains "@".
   * Sample: emilys / emilyspass
   */
  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    remember: [true],
  });

  get usernameCtrl() {
    return this.form.controls.username;
  }
  get passwordCtrl() {
    return this.form.controls.password;
  }

  ngAfterViewInit(): void {
    if (!this.googleBtn) return;
    this.google
      .renderButton(this.googleBtn.nativeElement, (payload, raw) => {
        this.auth.loginWithGoogle(payload, raw);
        const redirect =
          this.route.snapshot.queryParamMap.get('redirect') || '/home';
        this.router.navigateByUrl(redirect);
      })
      .catch((err: Error) => this.googleError.set(err.message));
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    this.errorMessage.set('');
    if (this.form.invalid || this.isDisabled()) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.loading.set(true);

    this.auth
      .login({ username: username ?? '', password: password ?? '' })
      .subscribe({
        next: () => {
          const redirect =
            this.route.snapshot.queryParamMap.get('redirect') || '/home';
          this.router.navigateByUrl(redirect);
        },
        error: (err: Error & { retryAfter?: number }) => {
          this.errorMessage.set(err.message);
          this.loading.set(false);
          if (typeof err.retryAfter === 'number') {
            this.startCooldown(err.retryAfter);
          }
        },
        complete: () => this.loading.set(false),
      });
  }

  private startCooldown(seconds: number): void {
    this.stopCooldown();
    this.cooldown.set(Math.max(1, seconds));
    this.cooldownTimer = setInterval(() => {
      this.cooldown.update((s) => Math.max(0, s - 1));
      if (this.cooldown() === 0) this.stopCooldown();
    }, 1000);
  }

  private stopCooldown(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  fillDemo(): void {
    this.form.setValue({
      username: 'emilys',
      password: 'emilyspass',
      remember: true,
    });
  }
}
