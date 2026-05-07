export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: ProductMeta;
  thumbnail: string;
  images: string[];
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProductCategory {
  slug: string;
  name: string;
  url: string;
}

export interface ProductQueryParams {
  limit?: number;
  skip?: number;
  select?: string;
  sortBy?: 'title' | 'price' | 'rating' | 'stock';
  order?: 'asc' | 'desc';
  q?: string;
}

/**
 * Note: dummyjson simulates write operations.
 *  - POST /products/add → returns the new created product with a new id (not persisted)
 *  - PUT/PATCH /products/:id → returns the updated product (not persisted)
 *  - DELETE /products/:id → returns the product with isDeleted & deletedOn (not persisted)
 */
export interface DeletedProduct extends Product {
  isDeleted: boolean;
  deletedOn: string;
}
