export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  expiresAt: string;
  user: AuthUser;
}

export interface RegisterRequest extends LoginRequest {
  firstName: string;
  lastName: string;
}

export interface MessageResponse {
  message: string;
}

export interface ApiErrorResponse {
  message?: string;
  details?: string;
  fieldErrors?: Record<string, string>;
}
