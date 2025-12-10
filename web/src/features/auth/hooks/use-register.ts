/**
 * Hook for registration functionality with Firebase
 */

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { signUp } from '@/core/firebase';
import { useAuthStore } from '@/core/store/auth-store';
import { UserCreateRequest } from '@/core/types';

/**
 * Map Firebase auth errors to user-friendly Spanish messages
 */
const getFirebaseErrorMessage = (error: FirebaseError): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está registrado.';
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido.';
    case 'auth/operation-not-allowed':
      return 'El registro con correo y contraseña no está habilitado.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Usa al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet.';
    default:
      return 'Error al crear la cuenta. Intenta de nuevo.';
  }
};

export const useRegister = () => {
  const navigate = useNavigate();
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);

  return useMutation({
    mutationFn: async (userData: UserCreateRequest) => {
      const userCredential = await signUp(
        userData.email,
        userData.password,
        userData.full_name
      );
      return userCredential.user;
    },
    onSuccess: (user) => {
      setFirebaseUser(user);
      navigate('/dashboard');
    },
    onError: (error) => {
      if (error instanceof FirebaseError) {
        throw new Error(getFirebaseErrorMessage(error));
      }
      throw error;
    },
  });
};
