import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { Product } from '../models/product.model';
import { ProductService } from '../services/product.service';

/**
 * Pre-fetches a product *before* the route activates. Combined with the cache
 * interceptor + service-level shareReplay dedup, this means:
 *  • If the user already viewed this product, navigation is instant (cache hit).
 *  • If two routes resolve the same product simultaneously, only one network call.
 *  • Errors don't block navigation — component handles `null` and shows fallback.
 */
export const productResolver: ResolveFn<Product | null> = (route) => {
  const id = route.paramMap.get('id');
  if (!id) return of(null);
  return inject(ProductService)
    .getProduct(id)
    .pipe(catchError(() => of(null)));
};
