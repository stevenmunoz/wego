/**
 * Hook for login functionality
 */

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/auth-api';
import { useAuthStore } from '@/core/store/auth-store';
import { authService } from '@/core/auth/auth-service';
import { LoginRequest } from '@/core/types';

export const useLogin = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const tokenResponse = await authApi.login(credentials);
      authService.setTokens(tokenResponse.access_token, tokenResponse.refresh_token);
      const user = await authApi.getCurrentUser();
      return user;
    },
    onSuccess: (user) => {
      setUser(user);
      navigate('/dashboard');
    },
  });
};
