export type RecipeCategory =
  | 'MEAT'
  | 'MEATLESS'
  | 'DESSERTS'
  | 'ALAMINUTES'
  | 'SOUPS'
  | 'SALADS'
  | 'DOUGH';

export interface RecipeSummaryResponse {
  id: number;
  recipeName: string;
  portions: number | null;
  cookingTime: number | null;
  category: RecipeCategory | null;
  imageUrl: string | null;
}

export interface RecipePageResponse {
  content: RecipeSummaryResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AuthorSummaryResponse {
  id: number;
  firstName: string | null;
  lastName: string | null;
}

export interface RecipeDetailsResponse extends RecipeSummaryResponse {
  products: string | null;
  cookingSteps: string | null;
  author: AuthorSummaryResponse;
}

export interface NutritionEstimateResponse {
  calories: number | null;
  proteinGrams: number | null;
  carbohydratesGrams: number | null;
  fatGrams: number | null;
  notes: string | null;
  estimatedAt: string | null;
}
