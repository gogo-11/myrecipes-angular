import { ParamMap, Params } from '@angular/router';
import { RecipeCategory } from './recipe.models';

export const recipeCategories: ReadonlyArray<{ value: RecipeCategory; label: string }> = [
  { value: 'MEAT', label: 'Meat' },
  { value: 'MEATLESS', label: 'Meatless' },
  { value: 'DESSERTS', label: 'Desserts' },
  { value: 'ALAMINUTES', label: 'A la minute' },
  { value: 'SOUPS', label: 'Soups' },
  { value: 'SALADS', label: 'Salads' },
  { value: 'DOUGH', label: 'Dough' },
];

export interface RecipeListQuery {
  keyword: string;
  category: RecipeCategory | null;
  page: number;
}

export function parseRecipeListQuery(params: ParamMap): RecipeListQuery {
  const rawPage = params.get('page') ?? '0';
  const page = Number(rawPage);
  const rawCategory = params.get('category')?.trim().toUpperCase();

  return {
    keyword: params.get('keyword')?.trim() ?? '',
    category: recipeCategories.find((option) => option.value === rawCategory)?.value ?? null,
    page: /^\d+$/.test(rawPage) && Number.isSafeInteger(page) ? page : 0,
  };
}

export function recipeListQueryParams(query: RecipeListQuery): Params {
  return {
    keyword: query.keyword || null,
    category: query.category,
    page: query.page,
  };
}

export function sameRecipeListQuery(left: RecipeListQuery, right: RecipeListQuery): boolean {
  return left.keyword === right.keyword && left.category === right.category && left.page === right.page;
}

