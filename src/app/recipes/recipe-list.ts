import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecipePageResponse } from './recipe.models';

@Component({
  selector: 'app-recipe-list',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.scss',
})
export class RecipeList {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pageSize = 6;

  protected readonly recipesPage = signal<RecipePageResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly failedImages = signal<ReadonlySet<number>>(new Set());
  protected readonly pageLabel = computed(() => {
    const result = this.recipesPage();
    return result ? `Page ${result.page + 1} of ${result.totalPages}` : '';
  });

  private requestedPage = 0;

  constructor() {
    const page = Number(this.route.snapshot.queryParamMap.get('page') ?? 0);
    this.loadPage(Number.isSafeInteger(page) && page >= 0 ? page : 0);
  }

  protected previousPage(): void {
    const result = this.recipesPage();
    if (result && !result.first) this.loadPage(result.page - 1);
  }

  protected nextPage(): void {
    const result = this.recipesPage();
    if (result && !result.last) this.loadPage(result.page + 1);
  }

  protected retry(): void {
    this.loadPage(this.requestedPage);
  }

  protected imageFailed(id: number): void {
    this.failedImages.update((ids) => new Set([...ids, id]));
  }

  private loadPage(page: number): void {
    if (this.loading()) return;

    this.requestedPage = page;
    this.loading.set(true);
    this.error.set(false);
    this.http
      .get<RecipePageResponse>('/api/v1/recipes', {
        params: { page, size: this.pageSize },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.recipesPage.set(result);
          this.failedImages.set(new Set());
          this.loading.set(false);
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { page: result.page || null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
