/**
 * Authentication state management using Zustand with Firebase
 */

import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, logOut as firebaseLogOut } from '../firebase';
import { User, UserRole, UserStatus } from '../types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  initAuth: () => () => void;
}

/**
 * Convert Firebase user to our app User type
 */
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  full_name: firebaseUser.displayName || '',
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
  is_verified: firebaseUser.emailVerified,
  created_at: firebaseUser.metadata.creationTime || new Date().toISOString(),
  updated_at: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
});

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  setFirebaseUser: (firebaseUser) => {
    if (firebaseUser) {
      const user = convertFirebaseUser(firebaseUser);
      set({ firebaseUser, user, isAuthenticated: true, isLoading: false });
    } else {
      set({ firebaseUser: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    try {
      await firebaseLogOut();
      set({ user: null, firebaseUser: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  initAuth: () => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthChange((firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email || 'null');
      if (firebaseUser) {
        const user = convertFirebaseUser(firebaseUser);
        console.log('User authenticated:', user.email);
        set({ firebaseUser, user, isAuthenticated: true, isLoading: false });
      } else {
        console.log('No user authenticated');
        set({ firebaseUser: null, user: null, isAuthenticated: false, isLoading: false });
      }
    });

    // Return unsubscribe function for cleanup
    return unsubscribe;
  },
}));
