import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, finalize, shareReplay } from 'rxjs';
import {
  Product,
  ProductListResponse,
  ProductCategory,
  ProductQueryParams,
  DeletedProduct,
} from '../models/product.model';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  private readonly paths = API_ENDPOINTS.products;

  /**
   * In-flight request map. Multiple concurrent subscribers to the same
   * URL share ONE network request. The HTTP cache interceptor only kicks
   * in AFTER a response — this map dedupes during the request itself.
   */
  private inflight = new Map<string, Observable<unknown>>();

  private dedupe<T>(key: string, request: Observable<T>): Observable<T> {
    const existing = this.inflight.get(key) as Observable<T> | undefined;
    if (existing) return existing;
    const shared = request.pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
      finalize(() => this.inflight.delete(key))
    );
    this.inflight.set(key, shared);
    return shared;
  }

  /**
   * GET /products
   * Supports limit, skip, select, sortBy, order. Use limit=0 to fetch all.
   */
  getProducts(params: ProductQueryParams = {}): Observable<ProductListResponse> {
    const url = `${this.api}${this.paths.base}`;
    const httpParams = this.buildParams(params);
    return this.dedupe(
      url + '?' + httpParams.toString(),
      this.http.get<ProductListResponse>(url, { params: httpParams })
    );
  }

  /** GET /products/:id */
  getProduct(id: number | string): Observable<Product> {
    const url = `${this.api}${this.paths.byId(id)}`;
    return this.dedupe(url, this.http.get<Product>(url));
  }

  /** GET /products/search?q= */
  searchProducts(
    query: string,
    params: ProductQueryParams = {}
  ): Observable<ProductListResponse> {
    const url = `${this.api}${this.paths.search}`;
    const httpParams = this.buildParams({ ...params, q: query });
    return this.dedupe(
      url + '?' + httpParams.toString(),
      this.http.get<ProductListResponse>(url, { params: httpParams })
    );
  }

  /** GET /products/categories — full category objects */
  getCategories(): Observable<ProductCategory[]> {
    const url = `${this.api}${this.paths.categories}`;
    return this.dedupe(url, this.http.get<ProductCategory[]>(url));
  }

  /** GET /products/category-list — slug array */
  getCategoryList(): Observable<string[]> {
    const url = `${this.api}${this.paths.categoryList}`;
    return this.dedupe(url, this.http.get<string[]>(url));
  }

  /** GET /products/category/:slug */
  getProductsByCategory(
    slug: string,
    params: ProductQueryParams = {}
  ): Observable<ProductListResponse> {
    const url = `${this.api}${this.paths.byCategory(slug)}`;
    const httpParams = this.buildParams(params);
    return this.dedupe(
      url + '?' + httpParams.toString(),
      this.http.get<ProductListResponse>(url, { params: httpParams })
    );
  }

  /**
   * POST /products/add — simulated.
   * Returns the new created product with a new id; not actually persisted on the server.
   */
  addProduct(payload: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.api}${this.paths.add}`, payload);
  }

  /**
   * PUT /products/:id — simulated.
   * Returns the updated product with modified data; not actually persisted on the server.
   */
  updateProduct(
    id: number | string,
    payload: Partial<Product>
  ): Observable<Product> {
    return this.http.put<Product>(
      `${this.api}${this.paths.byId(id)}`,
      payload
    );
  }

  /**
   * DELETE /products/:id — simulated.
   * Returns the product with isDeleted & deletedOn keys; not actually deleted on the server.
   */
  deleteProduct(id: number | string): Observable<DeletedProduct> {
    return this.http.delete<DeletedProduct>(
      `${this.api}${this.paths.byId(id)}`
    );
  }

  private buildParams(input: ProductQueryParams): HttpParams {
    let params = new HttpParams();
    (Object.keys(input) as (keyof ProductQueryParams)[]).forEach((key) => {
      const value = input[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
