import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';
import { routes } from '../app.routes';
import { AuthSessionService } from './auth-session.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    TestBed.inject(AuthSessionService).logout();
    http.verify();
  });

  it('guards both guest pages', () => {
    expect(routes.find((route) => route.path === 'login')?.canActivate).toContain(guestGuard);
    expect(routes.find((route) => route.path === 'register')?.canActivate).toContain(guestGuard);
  });

  it('waits for verification before redirecting a returning user', async () => {
    localStorage.setItem('myrecipes-auth-session', JSON.stringify({
      accessToken: 'saved-token', expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }));
    let settled = false;
    const result = TestBed.runInInjectionContext(() => guestGuard(
      {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot,
    ));
    expect(isObservable(result)).toBe(true);
    if (!isObservable(result)) return;
    const decision = firstValueFrom(result).then((value) => {
      settled = true;
      return value;
    });

    await Promise.resolve();
    expect(settled).toBe(false);
    http.expectOne('/api/v1/users/me').flush({
      id: 1, email: 'alex@example.com', firstName: 'Alex', lastName: 'Cook', role: 'USER',
    });
    expect(await decision).toEqual(TestBed.inject(Router).createUrlTree(['/']));
  });

  it('allows a visitor without a stored session', async () => {
    const result = TestBed.runInInjectionContext(() => guestGuard(
      {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot,
    ));
    expect(isObservable(result)).toBe(true);
    if (!isObservable(result)) return;
    expect(await firstValueFrom(result)).toBe(true);
    http.expectNone('/api/v1/users/me');
  });

  it('redirects an already authenticated user from a guest page', async () => {
    TestBed.inject(AuthSessionService).acceptLogin({
      tokenType: 'Bearer', accessToken: 'current-token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: { id: 1, email: 'alex@example.com', firstName: 'Alex', lastName: 'Cook', role: 'USER' },
    });
    const result = TestBed.runInInjectionContext(() => guestGuard(
      {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot,
    ));
    expect(isObservable(result)).toBe(true);
    if (!isObservable(result)) return;
    expect(await firstValueFrom(result)).toEqual(TestBed.inject(Router).createUrlTree(['/']));
    http.expectNone('/api/v1/users/me');
  });
});
