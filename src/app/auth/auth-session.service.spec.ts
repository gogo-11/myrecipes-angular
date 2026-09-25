import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from './auth-session.service';
import { LoginResponse } from './auth.models';

describe('AuthSessionService', () => {
  let session: AuthSessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
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
    expect(localStorage.getItem('myrecipes-auth-session')).not.toContain('Alex');
    session.logout();
    expect(session.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('myrecipes-auth-session')).toBeNull();
  });

  it('restores a stored session only after /users/me succeeds', () => {
    localStorage.setItem('myrecipes-auth-session', JSON.stringify({
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
    localStorage.setItem('myrecipes-auth-session', JSON.stringify({
      accessToken: 'bad-token', expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }));
    const restored = TestBed.runInInjectionContext(() => new AuthSessionService());
    restored.restore();
    http.expectOne('/api/v1/users/me').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(restored.status()).toBe('anonymous');
    expect(localStorage.getItem('myrecipes-auth-session')).toBeNull();
  });

  it('ignores expired stored tokens', () => {
    localStorage.setItem('myrecipes-auth-session', JSON.stringify({
      accessToken: 'expired', expiresAt: new Date(Date.now() - 1000).toISOString(),
    }));
    const restored = TestBed.runInInjectionContext(() => new AuthSessionService());
    restored.restore();
    expect(restored.status()).toBe('anonymous');
    http.expectNone('/api/v1/users/me');
  });

  it('verifies a token received from another tab before showing its user', () => {
    localStorage.setItem('myrecipes-auth-session', JSON.stringify({
      accessToken: 'other-tab-token', expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'myrecipes-auth-session', storageArea: localStorage }));

    expect(session.status()).toBe('restoring');
    expect(session.user()).toBeNull();
    expect(session.isAuthenticated()).toBe(false);
    const request = http.expectOne('/api/v1/users/me');
    expect(request.request.headers.get('Authorization')).toBeNull();
    request.flush(loginResponse().user);
    expect(session.isAuthenticated()).toBe(true);
  });

  it('clears the current user when another tab logs out', () => {
    session.acceptLogin(loginResponse());
    localStorage.removeItem('myrecipes-auth-session');
    window.dispatchEvent(new StorageEvent('storage', { key: 'myrecipes-auth-session', storageArea: localStorage }));

    expect(session.status()).toBe('anonymous');
    expect(session.user()).toBeNull();
    expect(session.tokenForRequest()).toBeNull();
  });

  it('ignores an old verification response after the stored session changes', () => {
    localStorage.setItem('myrecipes-auth-session', JSON.stringify({
      accessToken: 'first-token', expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'myrecipes-auth-session', storageArea: localStorage }));
    const oldRequest = http.expectOne('/api/v1/users/me');

    localStorage.setItem('myrecipes-auth-session', JSON.stringify({
      accessToken: 'second-token', expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'myrecipes-auth-session', storageArea: localStorage }));
    const newRequest = http.expectOne('/api/v1/users/me');
    expect(oldRequest.cancelled).toBe(true);
    expect(session.status()).toBe('restoring');
    expect(session.user()).toBeNull();

    newRequest.flush({ ...loginResponse().user, firstName: 'New' });
    expect(session.user()?.firstName).toBe('New');
    expect(session.tokenForRequest()).toBe('second-token');
  });

  it('keeps a new login when an earlier verification was still pending', () => {
    localStorage.setItem('myrecipes-auth-session', JSON.stringify({
      accessToken: 'saved-token', expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'myrecipes-auth-session', storageArea: localStorage }));
    const oldRequest = http.expectOne('/api/v1/users/me');

    session.acceptLogin(loginResponse());
    expect(oldRequest.cancelled).toBe(true);
    expect(session.isAuthenticated()).toBe(true);
    expect(session.user()?.firstName).toBe('Alex');
    expect(session.tokenForRequest()).toBe('test-token');
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
