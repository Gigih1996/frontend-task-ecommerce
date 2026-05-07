import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, finalize, shareReplay } from 'rxjs';
import {
  Recipe,
  RecipeListResponse,
  RecipeQueryParams,
  DeletedRecipe,
} from '../models/recipe.model';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  private readonly paths = API_ENDPOINTS.recipes;

  /** In-flight dedup — see ProductService for explanation. */
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

  getRecipes(params: RecipeQueryParams = {}): Observable<RecipeListResponse> {
    const url = `${this.api}${this.paths.base}`;
    const httpParams = this.buildParams(params);
    return this.dedupe(
      url + '?' + httpParams.toString(),
      this.http.get<RecipeListResponse>(url, { params: httpParams })
    );
  }

  getRecipe(id: number | string): Observable<Recipe> {
    const url = `${this.api}${this.paths.byId(id)}`;
    return this.dedupe(url, this.http.get<Recipe>(url));
  }

  searchRecipes(
    query: string,
    params: RecipeQueryParams = {}
  ): Observable<RecipeListResponse> {
    const url = `${this.api}${this.paths.search}`;
    const httpParams = this.buildParams({ ...params, q: query });
    return this.dedupe(
      url + '?' + httpParams.toString(),
      this.http.get<RecipeListResponse>(url, { params: httpParams })
    );
  }

  getTags(): Observable<string[]> {
    const url = `${this.api}${this.paths.tags}`;
    return this.dedupe(url, this.http.get<string[]>(url));
  }

  getRecipesByTag(
    tag: string,
    params: RecipeQueryParams = {}
  ): Observable<RecipeListResponse> {
    const url = `${this.api}${this.paths.byTag(tag)}`;
    const httpParams = this.buildParams(params);
    return this.dedupe(
      url + '?' + httpParams.toString(),
      this.http.get<RecipeListResponse>(url, { params: httpParams })
    );
  }

  getRecipesByMealType(
    meal: string,
    params: RecipeQueryParams = {}
  ): Observable<RecipeListResponse> {
    const url = `${this.api}${this.paths.byMealType(meal)}`;
    const httpParams = this.buildParams(params);
    return this.dedupe(
      url + '?' + httpParams.toString(),
      this.http.get<RecipeListResponse>(url, { params: httpParams })
    );
  }

  /** POST /recipes/add — simulated. */
  addRecipe(payload: Partial<Recipe>): Observable<Recipe> {
    return this.http.post<Recipe>(`${this.api}${this.paths.add}`, payload);
  }

  /** PUT /recipes/:id — simulated. */
  updateRecipe(
    id: number | string,
    payload: Partial<Recipe>
  ): Observable<Recipe> {
    return this.http.put<Recipe>(
      `${this.api}${this.paths.byId(id)}`,
      payload
    );
  }

  /** DELETE /recipes/:id — simulated. */
  deleteRecipe(id: number | string): Observable<DeletedRecipe> {
    return this.http.delete<DeletedRecipe>(
      `${this.api}${this.paths.byId(id)}`
    );
  }

  private buildParams(input: RecipeQueryParams): HttpParams {
    let params = new HttpParams();
    (Object.keys(input) as (keyof RecipeQueryParams)[]).forEach((key) => {
      const value = input[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
