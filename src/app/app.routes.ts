import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    title: 'Login | ShopEase',
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth-callback/auth-callback.component').then(
        (m) => m.AuthCallbackComponent
      ),
    title: 'Signing in… | ShopEase',
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'Home | ShopEase',
  },
  {
    path: 'product/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
    title: 'Product Detail | ShopEase',
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cart/cart.component').then((m) => m.CartComponent),
    title: 'Shopping Cart | ShopEase',
  },
  {
    path: 'recipes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/recipes/recipes.component').then(
        (m) => m.RecipesComponent
      ),
    title: 'Recipes | ShopEase',
  },
  {
    path: 'recipe/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/recipe-detail/recipe-detail.component').then(
        (m) => m.RecipeDetailComponent
      ),
    title: 'Recipe Detail | ShopEase',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
