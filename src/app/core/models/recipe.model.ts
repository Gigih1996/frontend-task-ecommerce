export type RecipeDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty | string;
  cuisine: string;
  caloriesPerServing: number;
  tags: string[];
  userId: number;
  image: string;
  rating: number;
  reviewCount: number;
  mealType: string[];
}

export interface RecipeListResponse {
  recipes: Recipe[];
  total: number;
  skip: number;
  limit: number;
}

export interface RecipeQueryParams {
  limit?: number;
  skip?: number;
  select?: string;
  sortBy?: 'name' | 'rating' | 'caloriesPerServing' | 'prepTimeMinutes';
  order?: 'asc' | 'desc';
  q?: string;
}

/**
 * Note: dummyjson simulates write operations on recipes.
 *  - POST /recipes/add → returns the new created recipe with a new id (not persisted)
 *  - PUT/PATCH /recipes/:id → returns the updated recipe with modified data (not persisted)
 *  - DELETE /recipes/:id → returns the recipe with isDeleted & deletedOn (not persisted)
 */
export interface DeletedRecipe extends Recipe {
  isDeleted: boolean;
  deletedOn: string;
}
