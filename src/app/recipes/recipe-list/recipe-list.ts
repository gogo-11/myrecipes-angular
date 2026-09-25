import { NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription, distinctUntilChanged, map, switchMap, takeUntil, timer } from 'rxjs';
import { RecipeCategory, RecipePageResponse } from '../recipe.models';
import { RecipeApiService } from '../recipe-api.service';
import {
  RecipeListQuery,
  parseRecipeListQuery,
  recipeCategories,
  recipeListQueryParams,
  sameRecipeListQuery,
} from '../recipe-list-query';

@Component({
  selector: 'app-recipe-list',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.scss',
})
export class RecipeList {
  private readonly recipeApi = inject(RecipeApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pageSize = 6;
  private readonly keywordChanges = new Subject<string>();
  private readonly cancelPendingSearch = new Subject<void>();
  private activeRequest?: Subscription;

  protected readonly categories = recipeCategories;
  protected readonly keyword = signal('');
  protected readonly category = signal<RecipeCategory | null>(null);
  protected readonly appliedQuery = signal<RecipeListQuery>({ keyword: '', category: null, page: 0 });
  protected readonly recipesPage = signal<RecipePageResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly failedImages = signal<ReadonlySet<number>>(new Set());
  protected readonly hasFilters = computed(() => Boolean(this.keyword().trim() || this.category()));
  protected readonly detailQueryParams = computed(() => recipeListQueryParams(this.appliedQuery()));
  protected readonly pageLabel = computed(() => {
    const result = this.recipesPage();
    return result ? `Page ${result.page + 1} of ${result.totalPages}` : '';
  });

  constructor() {
    this.route.queryParamMap
      .pipe(
        map(parseRecipeListQuery),
        distinctUntilChanged(sameRecipeListQuery),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        this.cancelPendingSearch.next();
        this.appliedQuery.set(query);
        this.keyword.set(query.keyword);
        this.category.set(query.category);
        this.loadPage(query);
      });

    this.keywordChanges
      .pipe(
        switchMap((value) => timer(300).pipe(
          takeUntil(this.cancelPendingSearch),
          map(() => value),
        )),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.applyQuery({
        keyword: value.trim(),
        category: this.category(),
        page: 0,
      }));
  }

  protected onKeywordInput(value: string): void {
    this.keyword.set(value);
    this.prepareForNewQuery();
    this.keywordChanges.next(value);
  }

  protected onCategoryChange(value: string): void {
    this.cancelPendingSearch.next();
    this.category.set(this.categories.find((option) => option.value === value)?.value ?? null);
    this.prepareForNewQuery();
    this.applyQuery({ keyword: this.keyword().trim(), category: this.category(), page: 0 });
  }

  protected clearFilters(): void {
    this.cancelPendingSearch.next();
    this.keyword.set('');
    this.category.set(null);
    this.prepareForNewQuery();
    this.applyQuery({ keyword: '', category: null, page: 0 });
  }

  protected previousPage(): void {
    const result = this.recipesPage();
    if (result && !result.first && !this.loading()) {
      this.applyQuery({ ...this.appliedQuery(), page: result.page - 1 });
    }
  }

  protected nextPage(): void {
    const result = this.recipesPage();
    if (result && !result.last && !this.loading()) {
      this.applyQuery({ ...this.appliedQuery(), page: result.page + 1 });
    }
  }

  protected retry(): void {
    this.loadPage(this.appliedQuery());
  }

  protected imageFailed(id: number): void {
    this.failedImages.update((ids) => new Set([...ids, id]));
  }

  private prepareForNewQuery(): void {
    this.activeRequest?.unsubscribe();
    this.recipesPage.set(null);
    this.loading.set(true);
    this.error.set(false);
  }

  private applyQuery(query: RecipeListQuery, replaceUrl = false): void {
    if (sameRecipeListQuery(query, this.appliedQuery())) {
      this.loadPage(query);
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: recipeListQueryParams(query),
      replaceUrl,
    });
  }

  private loadPage(query: RecipeListQuery): void {
    this.activeRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set(false);
    this.recipesPage.set(null);

    this.activeRequest = this.recipeApi
      .getPublicRecipes(query, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (query.page > 0 && (result.totalPages === 0 || query.page >= result.totalPages)) {
            this.applyQuery({ ...query, page: Math.max(0, result.totalPages - 1) }, true);
            return;
          }
          this.recipesPage.set(result);
          this.failedImages.set(new Set());
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
