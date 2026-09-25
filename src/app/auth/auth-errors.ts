import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from './auth.models';

export function authFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof HttpErrorResponse) || typeof error.error !== 'object' || error.error === null) return {};
  const response = error.error as ApiErrorResponse;
  return response.fieldErrors && typeof response.fieldErrors === 'object' ? response.fieldErrors : {};
}

export function authErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse) || error.status === 0 || error.status >= 500) return fallback;
  const response: unknown = error.error;
  if (typeof response === 'object' && response !== null && 'message' in response && typeof response.message === 'string') {
    return response.message;
  }
  return fallback;
}
