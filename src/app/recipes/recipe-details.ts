import { NgOptimizedImage } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, Subscription, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { NutritionEstimateResponse, RecipeDetailsResponse } from './recipe.models';
import { parseRecipeListQuery, recipeListQueryParams } from './recipe-list-query';

type DetailsStatus = 'loading' | 'ready' | 'not-found' | 'error';
type NutritionStatus = 'idle' | 'loading' | 'available' | 'unavailable' | 'error';

@Component({
  selector: 'app-recipe-details',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './recipe-details.html',
  styleUrl: './recipe-details.scss',
})
export class RecipeDetails {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly retryRequest = new Subject<void>();
  private nutritionRequest?: Subscription;

  protected readonly status = signal<DetailsStatus>('loading');
  protected readonly recipe = signal<RecipeDetailsResponse | null>(null);
  protected readonly imageFailed = signal(false);
  protected readonly nutritionStatus = signal<NutritionStatus>('idle');
  protected readonly nutrition = signal<NutritionEstimateResponse | null>(null);
  protected readonly authorName = computed(() => {
    const author = this.recipe()?.author;
    return [author?.firstName, author?.lastName].filter(Boolean).join(' ') || 'Unknown author';
  });
  protected readonly backQueryParams = recipeListQueryParams(
    parseRecipeListQuery(this.route.snapshot.queryParamMap),
  );

  constructor() {
    combineLatest([this.route.paramMap, this.retryRequest.pipe(startWith(void 0))])
      .pipe(
        switchMap(([params]) => {
          this.nutritionRequest?.unsubscribe();
          this.nutritionStatus.set('idle');
          this.nutrition.set(null);
          this.status.set('loading');
          this.recipe.set(null);
          this.imageFailed.set(false);

          const rawId = params.get('id');
          const id = Number(rawId);
          if (!rawId || !/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id)) {
            return of({ kind: 'not-found' } as const);
          }

          return this.http.get<RecipeDetailsResponse>(`/api/v1/recipes/${id}`).pipe(
            map((recipe) => ({ kind: 'ready' as const, recipe })),
            catchError((error: unknown) =>
              of({
                kind: error instanceof HttpErrorResponse && error.status === 404
                  ? 'not-found' as const
                  : 'error' as const,
              }),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result.kind === 'ready') {
          this.recipe.set(result.recipe);
          this.status.set('ready');
          this.loadNutrition(result.recipe.id);
          return;
        }
        this.status.set(result.kind);
      });
  }

  protected retry(): void {
    this.retryRequest.next();
  }

  protected retryNutrition(): void {
    const id = this.recipe()?.id;
    if (id !== undefined) this.loadNutrition(id);
  }

  private loadNutrition(id: number): void {
    this.nutritionRequest?.unsubscribe();
    this.nutrition.set(null);
    this.nutritionStatus.set('loading');
    this.nutritionRequest = this.http
      .get<NutritionEstimateResponse>(`/api/v1/recipes/${id}/nutrition`, { observe: 'response' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.status === 204 || response.body === null) {
            this.nutritionStatus.set('unavailable');
            return;
          }
          this.nutrition.set(response.body);
          this.nutritionStatus.set('available');
        },
        error: () => this.nutritionStatus.set('error'),
      });
  }
}
