import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Cart,
  CartListResponse,
  AddCartRequest,
  UpdateCartRequest,
  DeletedCart,
} from '../models/cart.model';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

interface ListParams {
  limit?: number;
  skip?: number;
  select?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  private readonly paths = API_ENDPOINTS.carts;

  /** GET /carts */
  getCarts(params: ListParams = {}): Observable<CartListResponse> {
    return this.http.get<CartListResponse>(`${this.api}${this.paths.base}`, {
      params: this.buildParams(params),
    });
  }

  /** GET /carts/:id */
  getCart(id: number | string): Observable<Cart> {
    return this.http.get<Cart>(`${this.api}${this.paths.byId(id)}`);
  }

  /** GET /carts/user/:userId */
  getCartsByUser(
    userId: number | string,
    params: ListParams = {}
  ): Observable<CartListResponse> {
    return this.http.get<CartListResponse>(
      `${this.api}${this.paths.byUser(userId)}`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * POST /carts/add — simulated.
   * Returns the new created cart with a new id; not actually persisted.
   */
  addCart(payload: AddCartRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.api}${this.paths.add}`, payload);
  }

  /**
   * PUT /carts/:id — simulated.
   * Pass `merge: true` to keep the existing products and merge the new ones.
   * Returns the updated cart; not actually persisted.
   */
  updateCart(
    id: number | string,
    payload: UpdateCartRequest
  ): Observable<Cart> {
    return this.http.put<Cart>(`${this.api}${this.paths.byId(id)}`, payload);
  }

  /**
   * DELETE /carts/:id — simulated.
   * Returns the cart with isDeleted & deletedOn; not actually deleted.
   */
  deleteCart(id: number | string): Observable<DeletedCart> {
    return this.http.delete<DeletedCart>(`${this.api}${this.paths.byId(id)}`);
  }

  private buildParams(input: ListParams): HttpParams {
    let params = new HttpParams();
    (Object.keys(input) as (keyof ListParams)[]).forEach((key) => {
      const value = input[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
