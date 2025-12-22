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
 * Role is set separately from Firestore profile, defaults to USER if not found
 */
const convertFirebaseUser = (
  firebaseUser: FirebaseUser,
  firestoreRole?: FirestoreUserRole | null
): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  full_name: firebaseUser.displayName || '',
  role: mapFirestoreRoleToUserRole(firestoreRole),
  status: UserStatus.ACTIVE,
  is_verified: firebaseUser.emailVerified,
  created_at: firebaseUser.metadata.creationTime || new Date().toISOString(),
  updated_at: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
});

/**
 * Map Firestore role string to UserRole enum
 * SECURITY: Default to USER role if role is unknown/missing
 */
const mapFirestoreRoleToUserRole = (role?: FirestoreUserRole | null): UserRole => {
  switch (role) {
    case 'admin':
      return UserRole.ADMIN;
    case 'driver':
      return UserRole.DRIVER;
    case 'user':
    default:
      return UserRole.USER;
  }
};

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
      // Use existing userRole if available, otherwise default to USER
      const currentRole = get().userRole;
      const user = convertFirebaseUser(firebaseUser, currentRole);
      set({ firebaseUser, user, isAuthenticated: true, isLoading: false });
    } else {
      set({
        firebaseUser: null,
        user: null,
        userRole: null,
        isAuthenticated: false,
        isLoading: false,
      });
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
      if (import.meta.env.DEV) {
        console.log('[Auth] State changed:', firebaseUser ? 'authenticated' : 'not authenticated');
      }
      if (firebaseUser) {
        // Fetch user role from Firestore FIRST
        const userProfile = await getUserProfile(firebaseUser.uid);
        const userRole = userProfile?.role || null;
        if (import.meta.env.DEV) {
          console.log('[Auth] User role:', userRole);
        }

        // Create user object with correct role from Firestore
        const user = convertFirebaseUser(firebaseUser, userRole);

        set({
          firebaseUser,
          user,
          userRole,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
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
