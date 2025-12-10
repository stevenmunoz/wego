/**
 * Authentication API service
 */

import { apiClient } from '@/core/api/client';
import { LoginRequest, TokenResponse, UserCreateRequest, User } from '@/core/types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: UserCreateRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users/', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
