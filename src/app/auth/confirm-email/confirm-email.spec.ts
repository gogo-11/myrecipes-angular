import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ConfirmEmail } from './confirm-email';

describe('ConfirmEmail', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmEmail],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: 'email-token' }) } } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('does not consume the token until the visitor clicks confirm', () => {
    const fixture = TestBed.createComponent(ConfirmEmail);
    fixture.detectChanges();
    http.expectNone('/api/v1/auth/email-confirmations/confirm');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    const request = http.expectOne('/api/v1/auth/email-confirmations/confirm');
    expect(request.request.body).toEqual({ token: 'email-token' });
    request.flush({ message: 'Email confirmed successfully.' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Your email has been confirmed');
  });

  it('shows an invalid or used token state for 400', () => {
    const fixture = TestBed.createComponent(ConfirmEmail);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/auth/email-confirmations/confirm')
      .flush({ message: 'Invalid confirmation token.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('invalid or has already been used');
    expect((fixture.nativeElement.querySelector('a[href="/resend-confirmation"]') as HTMLAnchorElement)).not.toBeNull();
  });

  it('allows retry after a transient failure', () => {
    const fixture = TestBed.createComponent(ConfirmEmail);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/auth/email-confirmations/confirm')
      .flush('Unavailable', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('may have processed');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/auth/email-confirmations/confirm').flush({ message: 'Email confirmed successfully.' });
  });
});
