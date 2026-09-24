import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApiService } from './auth-api.service';
import { authErrorMessage, authFieldErrors } from './auth-errors';

@Component({
  selector: 'app-resend-confirmation',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './resend-confirmation.html',
  styleUrl: './resend-confirmation.scss',
})
export class ResendConfirmation {
  private readonly api = inject(AuthApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly loading = signal(false);
  protected readonly success = signal(false);
  protected readonly error = signal('');
  protected readonly fieldErrors = signal<Record<string, string>>({});

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading() || this.success()) return;
    this.loading.set(true);
    this.error.set('');
    this.fieldErrors.set({});
    this.api.resendConfirmation(this.form.controls.email.value.trim())
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.fieldErrors.set(authFieldErrors(error));
        this.error.set(authErrorMessage(error, 'The request could not be completed. Please try again.'));
      },
    });
  }
}
