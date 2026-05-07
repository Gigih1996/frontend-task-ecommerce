import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { Recipe } from '../models/recipe.model';
import { RecipeService } from '../services/recipe.service';

/** Pre-fetches a recipe before the route activates — see product.resolver.ts. */
export const recipeResolver: ResolveFn<Recipe | null> = (route) => {
  const id = route.paramMap.get('id');
  if (!id) return of(null);
  return inject(RecipeService)
    .getRecipe(id)
    .pipe(catchError(() => of(null)));
};
