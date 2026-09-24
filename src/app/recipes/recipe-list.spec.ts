import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RecipeList } from './recipe-list';
import { RecipePageResponse } from './recipe.models';

describe('RecipeList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads six public recipes and navigates using response metadata', async () => {
    const fixture = TestBed.createComponent(RecipeList);
    fixture.detectChanges();

    const firstRequest = http.expectOne('/api/v1/recipes?page=0&size=6');
    expect(firstRequest.request.method).toBe('GET');
    firstRequest.flush(page(0, true, false));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Vegetable soup');
    expect((fixture.nativeElement.querySelector('.recipe-link') as HTMLAnchorElement).getAttribute('href'))
      .toBe('/recipes/1?page=0');
    const buttons = fixture.nativeElement.querySelectorAll('nav button') as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(false);

    buttons[1].click();
    await fixture.whenStable();
    const nextRequest = http.expectOne('/api/v1/recipes?page=1&size=6');
    nextRequest.flush(page(1, false, true));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Page 2 of 2');
    const updatedButtons = fixture.nativeElement.querySelectorAll('nav button') as NodeListOf<HTMLButtonElement>;
    expect(updatedButtons[0].disabled).toBe(false);
    expect(updatedButtons[1].disabled).toBe(true);
  });

  it('restores keyword, category, and page from the URL', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/?keyword=soup&category=SOUPS&page=1');
    const fixture = TestBed.createComponent(RecipeList);
    fixture.detectChanges();

    const request = http.expectOne('/api/v1/recipes?page=1&size=6&keyword=soup&category=SOUPS');
    request.flush(page(1, false, true));
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('#recipe-keyword') as HTMLInputElement).value).toBe('soup');
    expect((fixture.nativeElement.querySelector('#recipe-category') as HTMLSelectElement).value).toBe('SOUPS');
    expect((fixture.nativeElement.querySelector('.recipe-link') as HTMLAnchorElement).getAttribute('href'))
      .toBe('/recipes/1?keyword=soup&category=SOUPS&page=1');
  });

  it('resets the page on category change and preserves filters during pagination', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/?keyword=soup&page=2');
    const fixture = TestBed.createComponent(RecipeList);
    fixture.detectChanges();
    http.expectOne('/api/v1/recipes?page=2&size=6&keyword=soup').flush(page(2, false, true));
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#recipe-category') as HTMLSelectElement;
    select.value = 'SOUPS';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(router.url).toBe('/?keyword=soup&category=SOUPS&page=0');
    http.expectOne('/api/v1/recipes?page=0&size=6&keyword=soup&category=SOUPS')
      .flush(page(0, true, false));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.pagination button:last-child') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(router.url).toBe('/?keyword=soup&category=SOUPS&page=1');
    http.expectOne('/api/v1/recipes?page=1&size=6&keyword=soup&category=SOUPS')
      .flush(page(1, false, true));
  });

  it('debounces keyword changes and cancels stale requests', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/?page=2');
    const fixture = TestBed.createComponent(RecipeList);
    fixture.detectChanges();
    const initial = http.expectOne('/api/v1/recipes?page=2&size=6');

    const input = fixture.nativeElement.querySelector('#recipe-keyword') as HTMLInputElement;
    input.value = 's';
    input.dispatchEvent(new Event('input'));
    input.value = 'soup';
    input.dispatchEvent(new Event('input'));
    expect(initial.cancelled).toBe(true);
    http.expectNone((request) => request.params.has('keyword'));

    await new Promise((resolve) => setTimeout(resolve, 350));
    await fixture.whenStable();
    expect(router.url).toBe('/?keyword=soup&page=0');
    http.expectOne('/api/v1/recipes?page=0&size=6&keyword=soup').flush(page(0, true, true));
  });

  it('shows an error and retries the same page', () => {
    const fixture = TestBed.createComponent(RecipeList);
    fixture.detectChanges();
    http.expectOne('/api/v1/recipes?page=0&size=6').flush('Unavailable', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    (fixture.nativeElement.querySelector('.retry-button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/recipes?page=0&size=6').flush(page(0, true, true));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
});

function page(index: number, first: boolean, last: boolean): RecipePageResponse {
  return {
    content: [{
      id: 1,
      recipeName: 'Vegetable soup',
      portions: 4,
      cookingTime: 30,
      category: 'SOUPS',
      imageUrl: null,
    }],
    page: index,
    size: 6,
    totalElements: 7,
    totalPages: 2,
    first,
    last,
  };
}
