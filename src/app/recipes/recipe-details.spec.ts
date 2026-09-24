import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RecipeDetails } from './recipe-details';
import { NutritionEstimateResponse, RecipeDetailsResponse } from './recipe.models';

describe('RecipeDetails', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeDetails],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '7' })),
            snapshot: { queryParamMap: convertToParamMap({ keyword: 'soup', category: 'SOUPS', page: '1' }) },
          },
        },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the backend details and a link to the previous list page', () => {
    const fixture = TestBed.createComponent(RecipeDetails);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading recipe');

    const request = http.expectOne('/api/v1/recipes/7');
    expect(request.request.method).toBe('GET');
    request.flush(recipe());
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Vegetable soup');
    expect(text).toContain('By Alex Cook');
    expect(text).toContain('Carrots');
    expect(text).toContain('Simmer');
    expect(text).toContain('Loading cached nutrition estimate');
    expect((fixture.nativeElement.querySelector('.back-link') as HTMLAnchorElement).getAttribute('href'))
      .toBe('/?keyword=soup&category=SOUPS&page=1');
    expect((fixture.nativeElement.querySelector('.recipe-image img') as HTMLImageElement).getAttribute('src'))
      .toBe('/api/v1/recipes/7/image');

    const nutritionRequest = http.expectOne('/api/v1/recipes/7/nutrition');
    expect(nutritionRequest.request.method).toBe('GET');
    nutritionRequest.flush(estimate());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('420 kcal');
    expect(fixture.nativeElement.textContent).toContain('25 g');
    expect(fixture.nativeElement.textContent).toContain('Per portion estimate');
  });

  it('shows the local placeholder when the recipe image fails', () => {
    const fixture = TestBed.createComponent(RecipeDetails);
    http.expectOne('/api/v1/recipes/7').flush(recipe());
    http.expectOne('/api/v1/recipes/7/nutrition').flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.recipe-image img') as HTMLImageElement)
      .dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('.recipe-image img') as HTMLImageElement).getAttribute('src'))
      .toBe('/recipe-placeholder.svg');
  });

  it('shows a not-found message for HTTP 404', () => {
    const fixture = TestBed.createComponent(RecipeDetails);
    http.expectOne('/api/v1/recipes/7').flush('Missing', { status: 404, statusText: 'Not Found' });
    http.expectNone('/api/v1/recipes/7/nutrition');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Recipe not found');
  });

  it('shows an error for other failures and retries', () => {
    const fixture = TestBed.createComponent(RecipeDetails);
    http.expectOne('/api/v1/recipes/7').flush('Failure', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unable to load recipe');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/recipes/7').flush(recipe());
    http.expectOne('/api/v1/recipes/7/nutrition').flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Vegetable soup');
  });

  it('keeps recipe details visible when nutrition is unavailable or fails', () => {
    const fixture = TestBed.createComponent(RecipeDetails);
    http.expectOne('/api/v1/recipes/7').flush(recipe());
    http.expectOne('/api/v1/recipes/7/nutrition').flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No cached nutrition estimate');
    expect(fixture.nativeElement.textContent).toContain('Vegetable soup');

    // A fresh details load can still succeed even when the independent nutrition request fails.
    const details = TestBed.createComponent(RecipeDetails);
    http.expectOne('/api/v1/recipes/7').flush(recipe());
    http.expectOne('/api/v1/recipes/7/nutrition')
      .flush('Unavailable', { status: 503, statusText: 'Unavailable' });
    details.detectChanges();

    expect(details.nativeElement.textContent).toContain('Vegetable soup');
    expect(details.nativeElement.textContent).toContain('Nutrition could not be loaded');
    (details.nativeElement.querySelector('.nutrition button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/recipes/7/nutrition').flush(estimate());
    details.detectChanges();
    expect(details.nativeElement.textContent).toContain('420 kcal');
    http.expectNone((request) => request.method === 'POST');
  });
});

function estimate(): NutritionEstimateResponse {
  return {
    calories: 420,
    proteinGrams: 25,
    carbohydratesGrams: 50,
    fatGrams: 12,
    notes: 'Per portion estimate',
    estimatedAt: '2026-09-24T10:00:00',
  };
}

function recipe(): RecipeDetailsResponse {
  return {
    id: 7,
    recipeName: 'Vegetable soup',
    products: 'Carrots\nPotatoes',
    portions: 4,
    cookingTime: 30,
    cookingSteps: 'Simmer until tender.',
    category: 'SOUPS',
    imageUrl: '/api/v1/recipes/7/image',
    author: { id: 3, firstName: 'Alex', lastName: 'Cook' },
  };
}
