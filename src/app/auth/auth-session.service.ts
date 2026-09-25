import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthUser, LoginResponse } from './auth.models';

type SessionStatus = 'anonymous' | 'restoring' | 'authenticated' | 'verification-error';

interface StoredSession {
  accessToken: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly api = inject(AuthApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storageKey = 'myrecipes-auth-session';
  private accessToken: string | null = null;
  private expiresAt = 0;
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private restoreRequest?: Subscription;
  private sessionVersion = 0;

  readonly status = signal<SessionStatus>('anonymous');
  readonly user = signal<AuthUser | null>(null);
  readonly isAuthenticated = computed(() => this.status() === 'authenticated');
  readonly statusChanges = toObservable(this.status);

  constructor() {
    const stored = this.readStoredSession();
    if (stored) {
      this.accessToken = stored.accessToken;
      this.expiresAt = Date.parse(stored.expiresAt);
      this.status.set('restoring');
      this.scheduleExpiry();
    }
    const onStorage = (event: StorageEvent): void => this.handleStorageChange(event);
    window.addEventListener('storage', onStorage);
    this.destroyRef.onDestroy(() => window.removeEventListener('storage', onStorage));
  }

  restore(): void {
    if (!this.accessToken || this.status() === 'authenticated') return;
    if (this.status() === 'restoring' && this.restoreRequest && !this.restoreRequest.closed) return;
    this.restoreRequest?.unsubscribe();
    const version = ++this.sessionVersion;
    this.status.set('restoring');
    this.restoreRequest = this.api.currentUser().subscribe({
      next: (user) => {
        if (version !== this.sessionVersion) return;
        this.user.set(user);
        this.status.set('authenticated');
      },
      error: (error: unknown) => {
        if (version !== this.sessionVersion) return;
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.logout();
        } else {
          this.status.set('verification-error');
        }
      },
    });
  }

  acceptLogin(response: LoginResponse): boolean {
    const expiresAt = Date.parse(response.expiresAt);
    if (
      response.tokenType !== 'Bearer' ||
      !response.accessToken ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      return false;
    }
    this.invalidatePendingRequest();
    this.accessToken = response.accessToken;
    this.expiresAt = expiresAt;
    this.user.set(response.user);
    this.status.set('authenticated');
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          accessToken: response.accessToken,
          expiresAt: response.expiresAt,
        } satisfies StoredSession),
      );
    } catch {
      // The in-memory session remains usable when storage is disabled.
    }
    this.scheduleExpiry();
    return true;
  }

  tokenForRequest(): string | null {
    if (!this.accessToken) return null;
    if (this.expiresAt <= Date.now()) {
      this.logout();
      return null;
    }
    return this.accessToken;
  }

  logout(): void {
    this.clearSession();
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // The in-memory session has already been cleared.
    }
  }

  private clearSession(): void {
    this.invalidatePendingRequest();
    this.accessToken = null;
    this.expiresAt = 0;
    this.user.set(null);
    this.status.set('anonymous');
  }

  private invalidatePendingRequest(): void {
    this.sessionVersion++;
    this.restoreRequest?.unsubscribe();
    this.restoreRequest = undefined;
    clearTimeout(this.expiryTimer);
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key !== this.storageKey && event.key !== null) return;
    const stored = this.readStoredSession();
    if (!stored) {
      this.clearSession();
      return;
    }
    const expiresAt = Date.parse(stored.expiresAt);
    if (stored.accessToken === this.accessToken && expiresAt === this.expiresAt) return;
    this.invalidatePendingRequest();
    this.accessToken = stored.accessToken;
    this.expiresAt = expiresAt;
    this.user.set(null);
    this.status.set('restoring');
    this.scheduleExpiry();
    this.restore();
  }

  private readStoredSession(): StoredSession | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const stored: unknown = JSON.parse(raw);
      if (!this.isStoredSession(stored)) return null;
      if (Date.parse(stored.expiresAt) <= Date.now()) {
        localStorage.removeItem(this.storageKey);
        return null;
      }
      return stored;
    } catch {
      // Storage can be disabled; login still works for this page session.
      return null;
    }
  }

  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer);
    const remaining = this.expiresAt - Date.now();
    if (remaining <= 0) {
      this.logout();
      return;
    }
    this.expiryTimer = setTimeout(() => this.scheduleExpiry(), Math.min(remaining, 2_147_483_647));
  }

  private isStoredSession(value: unknown): value is StoredSession {
    if (typeof value !== 'object' || value === null) return false;
    const item = value as Partial<StoredSession>;
    return (
      typeof item.accessToken === 'string' &&
      item.accessToken.length > 0 &&
      typeof item.expiresAt === 'string' &&
      Number.isFinite(Date.parse(item.expiresAt))
    );
  }
}
