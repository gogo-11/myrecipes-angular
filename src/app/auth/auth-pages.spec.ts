import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CheckEmail } from './check-email';
import { AuthSessionService } from './auth-session.service';
import { Login } from './login';
import { Register } from './register';
import { ResendConfirmation } from './resend-confirmation';

describe('authentication pages', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([
        { path: '', component: CheckEmail },
        { path: 'check-email', component: CheckEmail },
      ])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    TestBed.inject(AuthSessionService).logout();
    http.verify();
  });

  it('shows a generic login error and an optional resend link on 401', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fill(fixture.nativeElement, '#login-email', 'alex@example.com');
    fill(fixture.nativeElement, '#login-password', 'wrong-password');
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    http.expectOne('/api/v1/auth/login').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Unable to sign in with these credentials');
    expect(fixture.nativeElement.textContent).toContain('If you still need to confirm your email');
  });

  it('stores a successful login and returns to public recipes', async () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fill(fixture.nativeElement, '#login-email', 'alex@example.com');
    fill(fixture.nativeElement, '#login-password', 'secret123');
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/v1/auth/login');
    expect(request.request.body).toEqual({ email: 'alex@example.com', password: 'secret123' });
    request.flush({
      tokenType: 'Bearer', accessToken: 'test-token', expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: { id: 1, email: 'alex@example.com', firstName: 'Alex', lastName: 'Cook', role: 'USER' },
    });
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(sessionStorage.getItem('myrecipes-auth-session')).toContain('test-token');
  });

  it('registers without logging in and navigates to check-email', async () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    fill(fixture.nativeElement, '#first-name', 'Alex');
    fill(fixture.nativeElement, '#last-name', 'Cook');
    fill(fixture.nativeElement, '#register-email', 'alex@example.com');
    fill(fixture.nativeElement, '#register-password', 'secret123');
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/v1/auth/register');
    expect(request.request.body).toEqual({
      firstName: 'Alex', lastName: 'Cook', email: 'alex@example.com', password: 'secret123',
    });
    request.flush({ message: 'Check your email' });
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/check-email');
    expect(sessionStorage.getItem('myrecipes-auth-session')).toBeNull();
  });

  it('keeps the check-email instructions available without navigation state', () => {
    const fixture = TestBed.createComponent(CheckEmail);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Check your email');
    expect(fixture.nativeElement.querySelector('a[href="/resend-confirmation"]')).not.toBeNull();
  });

  it('shows the same generic resend outcome for a 202 response', () => {
    const fixture = TestBed.createComponent(ResendConfirmation);
    fixture.detectChanges();
    fill(fixture.nativeElement, '#resend-email', 'alex@example.com');
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/v1/auth/email-confirmations/resend');
    expect(request.request.body).toEqual({ email: 'alex@example.com' });
    request.flush({ message: 'If the account exists and still needs confirmation, an email will be sent.' },
      { status: 202, statusText: 'Accepted' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('If the account exists and still needs confirmation');
  });
});

function fill(root: HTMLElement, selector: string, value: string): void {
  const input = root.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}
