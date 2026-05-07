export interface CartProduct {
  id: number;
  title: string;
  price: number;
  quantity: number;
  total: number;
  discountPercentage: number;
  /** Server returns either `discountedTotal` (list/get) or `discountedPrice` (add). */
  discountedTotal?: number;
  discountedPrice?: number;
  thumbnail: string;
}

export interface Cart {
  id: number;
  products: CartProduct[];
  total: number;
  discountedTotal: number;
  userId: number;
  totalProducts: number;
  totalQuantity: number;
}

export interface CartListResponse {
  carts: Cart[];
  total: number;
  skip: number;
  limit: number;
}

export interface CartProductInput {
  id: number;
  quantity: number;
}

export interface AddCartRequest {
  userId: number;
  products: CartProductInput[];
}

export interface UpdateCartRequest {
  /** When true, existing products are kept and merged with the new ones. */
  merge?: boolean;
  products: CartProductInput[];
}

/**
 * Note: dummyjson simulates write operations on carts.
 *  - POST /carts/add → returns the new created cart with a new id (not persisted)
 *  - PUT/PATCH /carts/:id → returns the updated cart with modified data (not persisted)
 *  - DELETE /carts/:id → returns the cart with isDeleted & deletedOn (not persisted)
 */
export interface DeletedCart extends Cart {
  isDeleted: boolean;
  deletedOn: string;
}
