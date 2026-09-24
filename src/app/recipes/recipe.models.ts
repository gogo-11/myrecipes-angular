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
