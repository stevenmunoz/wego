/**
 * Hook for registration functionality
 */

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/auth-api';
import { UserCreateRequest } from '@/core/types';

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (userData: UserCreateRequest) => authApi.register(userData),
    onSuccess: () => {
      navigate('/login');
    },
  });
};
