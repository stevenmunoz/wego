/**
 * Authentication state management using Zustand
 */

import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../auth/auth-service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    if (user) {
      authService.setUser(user);
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  initAuth: () => {
    const user = authService.getUser();
    const isAuthenticated = authService.isAuthenticated();
    set({ user, isAuthenticated, isLoading: false });
  },
}));
