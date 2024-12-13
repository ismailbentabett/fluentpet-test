export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export type UserRole = "user" | "admin";

export interface AuthResponse<T = void> {
  success: boolean;

  data?: T;

  error?: string;
}

export interface AuthError {
  code: string;
  message: string;
  technical?: unknown;
}
