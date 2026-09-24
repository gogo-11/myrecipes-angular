import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RecipeList } from './recipe-list';
import { RecipePageResponse } from './recipe.models';

describe('RecipeList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeList],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads six public recipes and navigates using response metadata', () => {
    const fixture = TestBed.createComponent(RecipeList);
    fixture.detectChanges();

    const firstRequest = http.expectOne('/api/v1/recipes?page=0&size=6');
    expect(firstRequest.request.method).toBe('GET');
    firstRequest.flush(page(0, true, false));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Vegetable soup');
    const buttons = fixture.nativeElement.querySelectorAll('nav button') as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(false);

    buttons[1].click();
    const nextRequest = http.expectOne('/api/v1/recipes?page=1&size=6');
    nextRequest.flush(page(1, false, true));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Page 2 of 2');
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(true);
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
