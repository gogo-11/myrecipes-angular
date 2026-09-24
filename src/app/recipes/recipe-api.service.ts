import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RecipeListQuery } from './recipe-list-query';
import { NutritionEstimateResponse, RecipeDetailsResponse, RecipePageResponse } from './recipe.models';

@Injectable({ providedIn: 'root' })
export class RecipeApiService {
  private readonly http = inject(HttpClient);

  getPublicRecipes(query: RecipeListQuery, size: number): Observable<RecipePageResponse> {
    const params: Record<string, string | number> = { page: query.page, size };
    if (query.keyword) params['keyword'] = query.keyword;
    if (query.category) params['category'] = query.category;

    return this.http.get<RecipePageResponse>('/api/v1/recipes', { params });
  }

  getPublicRecipe(id: number): Observable<RecipeDetailsResponse> {
    return this.http.get<RecipeDetailsResponse>(`/api/v1/recipes/${id}`);
  }

  getCachedNutrition(id: number): Observable<HttpResponse<NutritionEstimateResponse>> {
    return this.http.get<NutritionEstimateResponse>(`/api/v1/recipes/${id}/nutrition`, {
      observe: 'response',
    });
  }
}
