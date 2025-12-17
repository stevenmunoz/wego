/**
 * Shared types and interfaces
 */

export interface ApiError {
  error: {
    message: string;
    type: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
}

export interface UserUpdateRequest {
  full_name: string;
}

export * from './vehicle.types';
export * from './vehicle-finance.types';
