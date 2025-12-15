/**
 * Hook for fetching and managing users (admin only)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllUsers,
  getAllDrivers,
  createUserProfile,
  updateUserProfile,
  createDriverProfile,
  updateDriverProfile,
  createUserAsAdmin,
  type FirestoreUser,
  type FirestoreDriver,
  type UserRole,
} from '@/core/firebase';

interface UseUsersReturn {
  users: FirestoreUser[];
  drivers: FirestoreDriver[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  registerNewUser: (data: { email: string; name: string; password: string; role: UserRole }) => Promise<boolean>;
  createUser: (userId: string, data: { email: string; name: string; role: UserRole }) => Promise<boolean>;
  updateUser: (userId: string, updates: Partial<Pick<FirestoreUser, 'name' | 'role' | 'is_active'>>) => Promise<boolean>;
  createDriver: (driverId: string, data: { email: string; name: string; phone: string; unique_slug: string }) => Promise<boolean>;
  updateDriver: (driverId: string, updates: Partial<Pick<FirestoreDriver, 'name' | 'phone' | 'unique_slug' | 'is_active'>>) => Promise<boolean>;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [drivers, setDrivers] = useState<FirestoreDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [fetchedUsers, fetchedDrivers] = await Promise.all([
        getAllUsers(),
        getAllDrivers(),
      ]);

      setUsers(fetchedUsers);
      setDrivers(fetchedDrivers);
    } catch (err) {
      console.error('[useUsers] Error fetching data:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar los datos';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerNewUser = useCallback(
    async (data: { email: string; name: string; password: string; role: UserRole }): Promise<boolean> => {
      setError(null);
      try {
        // Step 1: Create Firebase Auth user
        const authResult = await createUserAsAdmin(data.email, data.password, data.name);
        if (!authResult.success || !authResult.uid) {
          setError(authResult.error || 'Error al crear el usuario en autenticación');
          return false;
        }

        // Step 2: Create Firestore user profile
        const profileResult = await createUserProfile(authResult.uid, {
          email: data.email,
          name: data.name,
          role: data.role,
        });

        if (!profileResult.success) {
          setError(profileResult.error || 'Error al crear el perfil del usuario');
          return false;
        }

        // Refresh data
        await fetchData();
        return true;
      } catch (err) {
        console.error('[useUsers] Error registering new user:', err);
        const message = err instanceof Error ? err.message : 'Error al registrar el usuario';
        setError(message);
        return false;
      }
    },
    [fetchData]
  );

  const createUser = useCallback(
    async (userId: string, data: { email: string; name: string; role: UserRole }): Promise<boolean> => {
      setError(null);
      try {
        const result = await createUserProfile(userId, data);
        if (result.success) {
          await fetchData();
          return true;
        }
        setError(result.error || 'Error al crear el usuario');
        return false;
      } catch (err) {
        console.error('[useUsers] Error creating user:', err);
        const message = err instanceof Error ? err.message : 'Error al crear el usuario';
        setError(message);
        return false;
      }
    },
    [fetchData]
  );

  const updateUser = useCallback(
    async (userId: string, updates: Partial<Pick<FirestoreUser, 'name' | 'role' | 'is_active'>>): Promise<boolean> => {
      setError(null);
      try {
        const result = await updateUserProfile(userId, updates);
        if (result.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
          );
          return true;
        }
        setError(result.error || 'Error al actualizar el usuario');
        return false;
      } catch (err) {
        console.error('[useUsers] Error updating user:', err);
        const message = err instanceof Error ? err.message : 'Error al actualizar el usuario';
        setError(message);
        return false;
      }
    },
    []
  );

  const createDriver = useCallback(
    async (driverId: string, data: { email: string; name: string; phone: string; unique_slug: string }): Promise<boolean> => {
      setError(null);
      try {
        const result = await createDriverProfile(driverId, data);
        if (result.success) {
          await fetchData();
          return true;
        }
        setError(result.error || 'Error al crear el conductor');
        return false;
      } catch (err) {
        console.error('[useUsers] Error creating driver:', err);
        const message = err instanceof Error ? err.message : 'Error al crear el conductor';
        setError(message);
        return false;
      }
    },
    [fetchData]
  );

  const updateDriver = useCallback(
    async (driverId: string, updates: Partial<Pick<FirestoreDriver, 'name' | 'phone' | 'unique_slug' | 'is_active'>>): Promise<boolean> => {
      setError(null);
      try {
        const result = await updateDriverProfile(driverId, updates);
        if (result.success) {
          setDrivers((prev) =>
            prev.map((d) => (d.id === driverId ? { ...d, ...updates } : d))
          );
          return true;
        }
        setError(result.error || 'Error al actualizar el conductor');
        return false;
      } catch (err) {
        console.error('[useUsers] Error updating driver:', err);
        const message = err instanceof Error ? err.message : 'Error al actualizar el conductor';
        setError(message);
        return false;
      }
    },
    []
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    users,
    drivers,
    isLoading,
    error,
    refetch: fetchData,
    registerNewUser,
    createUser,
    updateUser,
    createDriver,
    updateDriver,
  };
};
