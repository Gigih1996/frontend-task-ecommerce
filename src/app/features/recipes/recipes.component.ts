import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { RecipeService } from '../../core/services/recipe.service';
import { Recipe } from '../../core/models/recipe.model';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { RecipeCardComponent } from '../../shared/components/recipe-card/recipe-card.component';
import { APP_ICONS } from '../../shared/icons';
import { environment } from '../../../environments/environment';

type Filter =
  | { kind: 'all' }
  | { kind: 'tag'; value: string }
  | { kind: 'meal'; value: string };

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    LoaderComponent,
    RecipeCardComponent,
  ],
  templateUrl: './recipes.component.html',
})
export class RecipesComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private destroyRef = inject(DestroyRef);
  protected icons = APP_ICONS;

  loading = signal(true);
  recipes = signal<Recipe[]>([]);
  tags = signal<string[]>([]);
  activeFilter = signal<Filter>({ kind: 'all' });
  searchTerm = signal('');

  readonly mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

  private query$ = new Subject<string>();

  ngOnInit(): void {
    this.loadTags();

    this.query$
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.loading.set(true)),
        switchMap((q) =>
          (q.trim()
            ? this.recipeService.searchRecipes(q.trim(), {
                limit: environment.defaultPageSize,
              })
            : this.recipeService.getRecipes({
                limit: environment.defaultPageSize,
              })
          ).pipe(
            catchError(() => {
              this.loading.set(false);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.recipes.set(res.recipes);
        this.loading.set(false);
      });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.activeFilter.set({ kind: 'all' });
    this.query$.next(value);
  }

  filterAll(): void {
    if (this.activeFilter().kind === 'all') return;
    this.activeFilter.set({ kind: 'all' });
    this.query$.next(this.searchTerm());
  }

  filterByTag(tag: string): void {
    if (this.isActive({ kind: 'tag', value: tag })) return;
    this.activeFilter.set({ kind: 'tag', value: tag });
    this.loading.set(true);
    this.recipeService
      .getRecipesByTag(tag, { limit: environment.defaultPageSize })
      .pipe(
        catchError(() => {
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.recipes.set(res.recipes);
        this.loading.set(false);
      });
  }

  filterByMeal(meal: string): void {
    if (this.isActive({ kind: 'meal', value: meal })) return;
    const slug = meal.toLowerCase();
    this.activeFilter.set({ kind: 'meal', value: meal });
    this.loading.set(true);
    this.recipeService
      .getRecipesByMealType(slug, { limit: environment.defaultPageSize })
      .pipe(
        catchError(() => {
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.recipes.set(res.recipes);
        this.loading.set(false);
      });
  }

  isActive(filter: Filter): boolean {
    const cur = this.activeFilter();
    if (cur.kind !== filter.kind) return false;
    if (cur.kind === 'all' || filter.kind === 'all')
      return cur.kind === filter.kind;
    return cur.value === filter.value;
  }

  trackByRecipe = (_: number, r: Recipe): number => r.id;
  trackByTag = (_: number, t: string): string => t;
  trackByMeal = (_: number, m: string): string => m;

  private loadTags(): void {
    this.recipeService
      .getTags()
      .pipe(
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((list) => this.tags.set(list.slice(0, 12)));
  }
}
