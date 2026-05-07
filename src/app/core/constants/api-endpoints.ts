/**
 * Endpoint paths (relative to environment.apiUrl).
 * Each service appends only the suffix, so we never repeat the host.
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
    refresh: '/auth/refresh',
  },
  products: {
    base: '/products',
    byId: (id: number | string) => `/products/${id}`,
    search: '/products/search',
    categories: '/products/categories',
    categoryList: '/products/category-list',
    byCategory: (slug: string) => `/products/category/${slug}`,
    add: '/products/add',
  },
  carts: {
    base: '/carts',
    byId: (id: number | string) => `/carts/${id}`,
    byUser: (userId: number | string) => `/carts/user/${userId}`,
    add: '/carts/add',
  },
  recipes: {
    base: '/recipes',
    byId: (id: number | string) => `/recipes/${id}`,
    search: '/recipes/search',
    tags: '/recipes/tags',
    byTag: (tag: string) => `/recipes/tag/${tag}`,
    byMealType: (meal: string) => `/recipes/meal-type/${meal}`,
    add: '/recipes/add',
  },
  images: {
    /** size = "150" (square) or "200x100" (custom). bg/color are hex without #. */
    placeholder: (size: string) => `/image/${size}`,
    placeholderBg: (size: string, bg: string) => `/image/${size}/${bg}`,
    placeholderBgColor: (size: string, bg: string, color: string) =>
      `/image/${size}/${bg}/${color}`,
    identicon: (hash: string, size: number) =>
      `/icon/${encodeURIComponent(hash)}/${size}`,
  },
} as const;
