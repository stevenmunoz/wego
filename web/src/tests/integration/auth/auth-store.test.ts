/**
 * Tests for Auth Store
 *
 * Tests authentication state management with Zustand.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import type { User as FirebaseUser } from 'firebase/auth';

// Use vi.hoisted to avoid "Cannot access before initialization" error
const { mockLogOut, mockOnAuthChange, mockGetUserProfile } = vi.hoisted(() => ({
  mockLogOut: vi.fn(),
  mockOnAuthChange: vi.fn(),
  mockGetUserProfile: vi.fn(),
}));

vi.mock('@/core/firebase', () => ({
  onAuthChange: mockOnAuthChange,
  logOut: mockLogOut,
  firebaseApp: {},
  firebaseAuth: { config: { authDomain: 'test.firebaseapp.com' } },
}));

vi.mock('@/core/firebase/firestore', () => ({
  getUserProfile: mockGetUserProfile,
}));

// Import store after mocking
import { useAuthStore } from '@/core/store/auth-store';

// Helper to create mock Firebase user
const createMockFirebaseUser = (overrides: Partial<FirebaseUser> = {}): Partial<FirebaseUser> => ({
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  photoURL: null,
  metadata: {
    creationTime: '2024-01-01T00:00:00.000Z',
    lastSignInTime: '2024-01-15T10:00:00.000Z',
  },
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
  ...overrides,
});

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    const store = useAuthStore.getState();
    store.setFirebaseUser(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('starts with no user authenticated', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.firebaseUser).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('has loading state initially', () => {
      // Reset to initial state
      useAuthStore.setState({ isLoading: true });
      const state = useAuthStore.getState();

      expect(state.isLoading).toBe(true);
    });
  });

  describe('setUser', () => {
    it('sets user and marks as authenticated', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user' as const,
        status: 'active' as const,
        is_verified: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('clears user when set to null', () => {
      // First set a user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user' as const,
        status: 'active' as const,
        is_verified: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });

      // Then clear it
      act(() => {
        useAuthStore.getState().setUser(null);
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setFirebaseUser', () => {
    it('converts Firebase user to app user format', () => {
      const mockFirebaseUser = createMockFirebaseUser();

      act(() => {
        useAuthStore.getState().setFirebaseUser(mockFirebaseUser as FirebaseUser);
      });

      const state = useAuthStore.getState();
      expect(state.firebaseUser).toBeTruthy();
      expect(state.user).toBeTruthy();
      expect(state.user?.id).toBe('test-uid-123');
      expect(state.user?.email).toBe('test@example.com');
      expect(state.user?.full_name).toBe('Test User');
      expect(state.isAuthenticated).toBe(true);
    });

    it('handles Firebase user without display name', () => {
      const mockFirebaseUser = createMockFirebaseUser({ displayName: null });

      act(() => {
        useAuthStore.getState().setFirebaseUser(mockFirebaseUser as FirebaseUser);
      });

      const state = useAuthStore.getState();
      expect(state.user?.full_name).toBe('');
    });

    it('handles Firebase user without email', () => {
      const mockFirebaseUser = createMockFirebaseUser({ email: null });

      act(() => {
        useAuthStore.getState().setFirebaseUser(mockFirebaseUser as FirebaseUser);
      });

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe('');
    });

    it('clears all auth state when set to null', () => {
      // First set a user
      const mockFirebaseUser = createMockFirebaseUser();
      act(() => {
        useAuthStore.getState().setFirebaseUser(mockFirebaseUser as FirebaseUser);
        useAuthStore.getState().setUserRole('admin');
      });

      // Then clear it
      act(() => {
        useAuthStore.getState().setFirebaseUser(null);
      });

      const state = useAuthStore.getState();
      expect(state.firebaseUser).toBeNull();
      expect(state.user).toBeNull();
      expect(state.userRole).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setUserRole', () => {
    it('sets user role', () => {
      act(() => {
        useAuthStore.getState().setUserRole('admin');
      });

      const state = useAuthStore.getState();
      expect(state.userRole).toBe('admin');
    });

    it('can set role to null', () => {
      act(() => {
        useAuthStore.getState().setUserRole('admin');
      });

      act(() => {
        useAuthStore.getState().setUserRole(null);
      });

      const state = useAuthStore.getState();
      expect(state.userRole).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('returns true when user role is admin', () => {
      act(() => {
        useAuthStore.getState().setUserRole('admin');
      });

      expect(useAuthStore.getState().isAdmin()).toBe(true);
    });

    it('returns false when user role is not admin', () => {
      act(() => {
        useAuthStore.getState().setUserRole('driver');
      });

      expect(useAuthStore.getState().isAdmin()).toBe(false);
    });

    it('returns false when user role is null', () => {
      act(() => {
        useAuthStore.getState().setUserRole(null);
      });

      expect(useAuthStore.getState().isAdmin()).toBe(false);
    });
  });

  describe('logout', () => {
    it('calls Firebase logout and clears state', async () => {
      mockLogOut.mockResolvedValue(undefined);

      // First set a user
      const mockFirebaseUser = createMockFirebaseUser();
      act(() => {
        useAuthStore.getState().setFirebaseUser(mockFirebaseUser as FirebaseUser);
        useAuthStore.getState().setUserRole('admin');
      });

      // Then logout
      await act(async () => {
        await useAuthStore.getState().logout();
      });

      expect(mockLogOut).toHaveBeenCalledTimes(1);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.firebaseUser).toBeNull();
      expect(state.userRole).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('throws error if Firebase logout fails', async () => {
      mockLogOut.mockRejectedValue(new Error('Logout failed'));

      await expect(
        act(async () => {
          await useAuthStore.getState().logout();
        })
      ).rejects.toThrow('Logout failed');
    });
  });

  describe('setLoading', () => {
    it('sets loading state', () => {
      act(() => {
        useAuthStore.getState().setLoading(true);
      });

      expect(useAuthStore.getState().isLoading).toBe(true);

      act(() => {
        useAuthStore.getState().setLoading(false);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('initAuth', () => {
    it('subscribes to auth state changes', () => {
      const mockUnsubscribe = vi.fn();
      mockOnAuthChange.mockReturnValue(mockUnsubscribe);

      let unsubscribe: (() => void) | undefined;
      act(() => {
        unsubscribe = useAuthStore.getState().initAuth();
      });

      expect(mockOnAuthChange).toHaveBeenCalledTimes(1);
      expect(typeof unsubscribe).toBe('function');
    });

    it('updates state when user logs in', async () => {
      const mockFirebaseUser = createMockFirebaseUser();
      mockGetUserProfile.mockResolvedValue({ role: 'admin' });

      // Capture the callback passed to onAuthChange
      let authCallback: ((user: FirebaseUser | null) => void) | undefined;
      mockOnAuthChange.mockImplementation((callback) => {
        authCallback = callback;
        return vi.fn();
      });

      act(() => {
        useAuthStore.getState().initAuth();
      });

      // Simulate auth state change
      await act(async () => {
        if (authCallback) {
          await authCallback(mockFirebaseUser);
        }
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
      expect(state.userRole).toBe('admin');
    });

    it('clears state when user logs out', async () => {
      // First set a user
      const mockFirebaseUser = createMockFirebaseUser();
      act(() => {
        useAuthStore.getState().setFirebaseUser(mockFirebaseUser as FirebaseUser);
        useAuthStore.getState().setUserRole('admin');
      });

      // Capture the callback
      let authCallback: ((user: FirebaseUser | null) => void) | undefined;
      mockOnAuthChange.mockImplementation((callback) => {
        authCallback = callback;
        return vi.fn();
      });

      act(() => {
        useAuthStore.getState().initAuth();
      });

      // Simulate logout (null user)
      await act(async () => {
        if (authCallback) {
          await authCallback(null);
        }
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.userRole).toBeNull();
    });
  });
});
