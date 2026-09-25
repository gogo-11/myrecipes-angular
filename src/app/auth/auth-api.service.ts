import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthUser, LoginRequest, LoginResponse, MessageResponse, RegisterRequest } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/v1/auth/login', request);
  }

  register(request: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>('/api/v1/auth/register', request);
  }

  currentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>('/api/v1/users/me');
  }

  confirmEmail(token: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>('/api/v1/auth/email-confirmations/confirm', { token });
  }

  resendConfirmation(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>('/api/v1/auth/email-confirmations/resend', { email });
  }
}
