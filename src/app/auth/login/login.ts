import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../auth-api.service';
import { AuthSessionService } from '../auth-session.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly api = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly invalidCredentials = signal(false);

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.invalidCredentials.set(false);
    const { email, password } = this.form.getRawValue();
    this.api.login({ email: email.trim(), password }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (!this.session.acceptLogin(response)) {
          this.error.set('The sign-in response was invalid. Please try again.');
          return;
        }
        void this.router.navigateByUrl('/');
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.invalidCredentials.set(error instanceof HttpErrorResponse && error.status === 401);
        this.error.set(this.invalidCredentials()
          ? 'Unable to sign in with these credentials.'
          : 'Sign-in is unavailable right now. Please try again.');
      },
    });
  }
}
