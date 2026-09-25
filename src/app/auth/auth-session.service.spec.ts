import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from './auth-session.service';
import { LoginResponse } from './auth.models';

describe('AuthSessionService', () => {
  let session: AuthSessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    session = TestBed.inject(AuthSessionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    session.logout();
    http.verify();
  });

  it('stores only the token and expiry and clears both on logout', () => {
    expect(session.acceptLogin(loginResponse())).toBe(true);
    expect(session.isAuthenticated()).toBe(true);
    expect(sessionStorage.getItem('myrecipes-auth-session')).not.toContain('Alex');
    session.logout();
    expect(session.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('myrecipes-auth-session')).toBeNull();
  });

  it('restores a stored session only after /users/me succeeds', () => {
    sessionStorage.setItem('myrecipes-auth-session', JSON.stringify({
      accessToken: 'saved-token', expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }));
    const restored = TestBed.runInInjectionContext(() => new AuthSessionService());
    expect(restored.status()).toBe('restoring');
    restored.restore();
    expect(restored.isAuthenticated()).toBe(false);
    http.expectOne('/api/v1/users/me').flush(loginResponse().user);
    expect(restored.isAuthenticated()).toBe(true);
    restored.logout();
  });

  it('clears a rejected stored session on 401', () => {
    sessionStorage.setItem('myrecipes-auth-session', JSON.stringify({
      accessToken: 'bad-token', expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }));
    const restored = TestBed.runInInjectionContext(() => new AuthSessionService());
    restored.restore();
    http.expectOne('/api/v1/users/me').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(restored.status()).toBe('anonymous');
    expect(sessionStorage.getItem('myrecipes-auth-session')).toBeNull();
  });

  it('ignores expired stored tokens', () => {
    sessionStorage.setItem('myrecipes-auth-session', JSON.stringify({
      accessToken: 'expired', expiresAt: new Date(Date.now() - 1000).toISOString(),
    }));
    const restored = TestBed.runInInjectionContext(() => new AuthSessionService());
    restored.restore();
    expect(restored.status()).toBe('anonymous');
    http.expectNone('/api/v1/users/me');
  });
});

function loginResponse(): LoginResponse {
  return {
    tokenType: 'Bearer',
    accessToken: 'test-token',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    user: { id: 1, email: 'alex@example.com', firstName: 'Alex', lastName: 'Cook', role: 'USER' },
  };
}
