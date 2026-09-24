import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
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
  private readonly storageKey = 'myrecipes-auth-session';
  private accessToken: string | null = null;
  private expiresAt = 0;
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private restoreRequest?: Subscription;

  readonly status = signal<SessionStatus>('anonymous');
  readonly user = signal<AuthUser | null>(null);
  readonly isAuthenticated = computed(() => this.status() === 'authenticated');

  constructor() {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) return;
      const stored: unknown = JSON.parse(raw);
      if (!this.isStoredSession(stored)) return;
      const expiresAt = Date.parse(stored.expiresAt);
      if (expiresAt <= Date.now()) {
        sessionStorage.removeItem(this.storageKey);
        return;
      }
      this.accessToken = stored.accessToken;
      this.expiresAt = expiresAt;
      this.status.set('restoring');
      this.scheduleExpiry();
    } catch {
      // Storage can be disabled; login still works for this page session.
    }
  }

  restore(): void {
    if (!this.accessToken || this.status() === 'authenticated') return;
    this.restoreRequest?.unsubscribe();
    this.status.set('restoring');
    this.restoreRequest = this.api.currentUser().subscribe({
      next: (user) => {
        this.user.set(user);
        this.status.set('authenticated');
      },
      error: (error: unknown) => {
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
    if (response.tokenType !== 'Bearer' || !response.accessToken || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return false;
    }
    this.restoreRequest?.unsubscribe();
    this.accessToken = response.accessToken;
    this.expiresAt = expiresAt;
    this.user.set(response.user);
    this.status.set('authenticated');
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify({
        accessToken: response.accessToken,
        expiresAt: response.expiresAt,
      } satisfies StoredSession));
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
    this.restoreRequest?.unsubscribe();
    clearTimeout(this.expiryTimer);
    this.accessToken = null;
    this.expiresAt = 0;
    this.user.set(null);
    this.status.set('anonymous');
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch {
      // The in-memory session has already been cleared.
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
    return typeof item.accessToken === 'string' && item.accessToken.length > 0
      && typeof item.expiresAt === 'string' && Number.isFinite(Date.parse(item.expiresAt));
  }
}
