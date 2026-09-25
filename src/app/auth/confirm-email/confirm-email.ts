import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthApiService } from '../auth-api.service';

type ConfirmationStatus = 'ready' | 'loading' | 'success' | 'invalid' | 'error';

@Component({
  selector: 'app-confirm-email',
  imports: [RouterLink],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.scss',
})
export class ConfirmEmail {
  private readonly api = inject(AuthApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token');
  protected readonly status = signal<ConfirmationStatus>(this.token ? 'ready' : 'invalid');

  protected confirm(): void {
    if (!this.token || (this.status() !== 'ready' && this.status() !== 'error')) return;
    this.status.set('loading');
    this.api.confirmEmail(this.token).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.status.set('success'),
      error: (error: unknown) => this.status.set(
        error instanceof HttpErrorResponse && error.status === 400 ? 'invalid' : 'error',
      ),
    });
  }
}
