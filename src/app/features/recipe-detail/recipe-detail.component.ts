import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  switchMap,
  tap,
} from 'rxjs';

import { RecipeService } from '../../core/services/recipe.service';
import { Recipe } from '../../core/models/recipe.model';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { RatingStarsComponent } from '../../shared/components/rating-stars/rating-stars.component';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';
import { APP_ICONS } from '../../shared/icons';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    LoaderComponent,
    RatingStarsComponent,
    ImgFallbackDirective,
  ],
  templateUrl: './recipe-detail.component.html',
})
export class RecipeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  private destroyRef = inject(DestroyRef);

  protected icons = APP_ICONS;

  loading = signal(true);
  recipe = signal<Recipe | null>(null);
  errorMessage = signal('');

  totalTime = computed(() => {
    const r = this.recipe();
    return r ? (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0) : 0;
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((p) => p.get('id')),
        filter((id): id is string => !!id),
        distinctUntilChanged(),
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set('');
        }),
        switchMap((id) =>
          this.recipeService.getRecipe(id).pipe(
            catchError(() => {
              this.errorMessage.set('Recipe not found.');
              this.loading.set(false);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((r) => {
        this.recipe.set(r);
        this.loading.set(false);
      });
  }

  trackByIndex = (i: number): number => i;
  trackByTag = (_: number, t: string): string => t;
}
