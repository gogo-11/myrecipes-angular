import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthApiService } from './auth-api.service';
import { authInterceptor } from './auth.interceptor';
import { AuthSessionService } from './auth-session.service';
import { RecipeApiService } from '../recipes/recipe-api.service';

describe('authInterceptor', () => {
  it('adds Bearer only to the protected user request', () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    const session = TestBed.inject(AuthSessionService);
    const api = TestBed.inject(AuthApiService);
    const recipes = TestBed.inject(RecipeApiService);
    const http = TestBed.inject(HttpTestingController);
    session.acceptLogin({
      tokenType: 'Bearer', accessToken: 'token-123', expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: { id: 1, email: 'a@example.com', firstName: 'A', lastName: 'B', role: 'USER' },
    });

    api.currentUser().subscribe();
    expect(http.expectOne('/api/v1/users/me').request.headers.get('Authorization')).toBe('Bearer token-123');
    api.confirmEmail('test-token').subscribe();
    expect(http.expectOne('/api/v1/auth/email-confirmations/confirm').request.headers.has('Authorization')).toBe(false);
    api.login({ email: 'a@example.com', password: 'secret' }).subscribe();
    expect(http.expectOne('/api/v1/auth/login').request.headers.has('Authorization')).toBe(false);
    recipes.getPublicRecipes({ keyword: '', category: null, page: 0 }, 6).subscribe();
    expect(http.expectOne('/api/v1/recipes?page=0&size=6').request.headers.has('Authorization')).toBe(false);
    session.logout();
    http.verify();
  });
});
