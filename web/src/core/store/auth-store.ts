/**
 * Authentication state management using Zustand with Firebase
 */

import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, logOut as firebaseLogOut } from '../firebase';
import { User, UserRole, UserStatus } from '../types';
import { getUserProfile, type UserRole as FirestoreUserRole } from '../firebase/firestore';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  userRole: FirestoreUserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUserRole: (role: FirestoreUserRole | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  initAuth: () => () => void;
  isAdmin: () => boolean;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  userRole: null,
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
      set({ firebaseUser: null, user: null, userRole: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUserRole: (userRole) => {
    set({ userRole });
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    try {
      await firebaseLogOut();
      set({ user: null, firebaseUser: null, userRole: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  isAdmin: () => {
    return get().userRole === 'admin';
  },

  initAuth: () => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email || 'null');
      if (firebaseUser) {
        const user = convertFirebaseUser(firebaseUser);
        console.log('User authenticated:', user.email);

        // Fetch user role from Firestore
        const userProfile = await getUserProfile(firebaseUser.uid);
        const userRole = userProfile?.role || null;
        console.log('User role:', userRole);

        set({
          firebaseUser,
          user,
          userRole,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        console.log('No user authenticated');
        set({
          firebaseUser: null,
          user: null,
          userRole: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    // Return unsubscribe function for cleanup
    return unsubscribe;
  },
}));
